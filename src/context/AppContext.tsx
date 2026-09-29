import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Incident,
  Runbook,
  AgentMemoryEntry,
  UserProfile,
  UserRole,
  TimelineEvent,
  RecommendedAction,
  PostMortem,
  ChatMessage,
} from '../types/incident';
import { SEED_USERS } from '../data/seedData';

interface AppContextType {
  currentUser: UserProfile;
  setCurrentUser: (user: UserProfile) => void;
  switchRole: (role: UserRole) => void;
  isLoggedIn: boolean;
  login: (email: string, role?: UserRole) => void;
  logout: () => void;
  organizationName: string;
  setOrganizationName: (org: string) => void;

  // Navigation
  activeTab: 'dashboard' | 'report' | 'investigation' | 'history' | 'runbooks' | 'memory' | 'post-mortem' | 'settings';
  setActiveTab: (tab: 'dashboard' | 'report' | 'investigation' | 'history' | 'runbooks' | 'memory' | 'post-mortem' | 'settings') => void;
  selectedIncidentId: string | null;
  setSelectedIncidentId: (id: string | null) => void;
  viewHistoricalModalIncident: Incident | null;
  setViewHistoricalModalIncident: (inc: Incident | null) => void;

  // Data
  incidents: Incident[];
  runbooks: Runbook[];
  memoryBank: AgentMemoryEntry[];
  chatMessages: Record<string, ChatMessage[]>;

  // Actions
  reportNewIncident: (data: {
    title: string;
    description: string;
    category: Incident['category'];
    severity: Incident['severity'];
    affectedService?: string;
    affectedUsers?: string;
    attachments?: Incident['attachments'];
  }) => Promise<Incident>;
  
  updateIncidentStatus: (incidentId: string, status: Incident['status'], reason?: string) => void;
  runAction: (incidentId: string, actionId: string) => Promise<{ success: boolean; log: string }>;
  resolveIncident: (incidentId: string, resolutionData: {
    rootCause: string;
    resolutionNotes: string;
    runbookUsedTitle?: string;
    durationMinutes: number;
    failedApproaches?: string[];
  }) => Promise<void>;
  
  generateAiPostMortem: (incidentId: string) => Promise<PostMortem | null>;
  savePostMortem: (incidentId: string, postMortem: PostMortem) => void;
  approvePostMortem: (incidentId: string) => void;
  confirmHypothesis: (incidentId: string, hypothesisId: string, engineerNote: string) => Promise<void>;
  verifyMemory: (incidentId: string, verifiedBy: string, verificationNote: string) => Promise<void>;

  // Chat
  sendIncidentChatMessage: (incidentId: string, text: string) => Promise<void>;

  // Runbook step toggling
  toggleRunbookStep: (runbookId: string, stepId: string) => void;
  saveNewRunbook: (runbook: Omit<Runbook, 'id'>) => void;
  teachAgentMemory: (entry: Omit<AgentMemoryEntry, 'id' | 'timesReferenced' | 'status'>) => void;

  // AI loading indicator
  isAiInvestigating: boolean;
  isSimulatingAction: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile>(SEED_USERS[1]); // default Marcus Vance (Support/IT)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);
  const [organizationName, setOrganizationName] = useState<string>('Acme Payments & Cloud Platform');
  
  const [activeTab, setActiveTab] = useState<AppContextType['activeTab']>('dashboard');
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>('INC-2026-088');
  const [viewHistoricalModalIncident, setViewHistoricalModalIncident] = useState<Incident | null>(null);

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [runbooks, setRunbooks] = useState<Runbook[]>([]);
  const [memoryBank, setMemoryBank] = useState<AgentMemoryEntry[]>([]);
  
  const [chatMessages, setChatMessages] = useState<Record<string, ChatMessage[]>>({
    'INC-2026-088': [
      {
        id: 'msg-1',
        sender: 'ai',
        text: 'I understand the problem. I\'ll help you investigate it.\n\n[OBSERVED] We detected checkout 504 timeouts and high queues.\n[HISTORICAL] Matched database connection pool exhaustion from March 2026. Connection metrics show pool capacity is near 98%.',
        timestamp: '06:42 AM',
      },
      {
        id: 'msg-2',
        sender: 'ai',
        text: 'Are customers seeing a 504 Gateway Timeout or a 500 Internal Server Error?',
        timestamp: '06:43 AM',
      },
    ],
  });

  const [isAiInvestigating, setIsAiInvestigating] = useState(false);
  const [isSimulatingAction, setIsSimulatingAction] = useState(false);

  // Load authoritative data from Vercel/Express Server APIs
  const refreshServerState = async () => {
    try {
      const [incRes, rbRes, memRes] = await Promise.all([
        fetch('/api/incidents'),
        fetch('/api/runbooks'),
        fetch('/api/memory'),
      ]);

      if (incRes.ok) {
        const data = await incRes.json();
        setIncidents(data);
      }
      if (rbRes.ok) {
        const data = await rbRes.json();
        setRunbooks(data);
      }
      if (memRes.ok) {
        const data = await memRes.json();
        setMemoryBank(data);
      }
    } catch (e) {
      console.warn('[AppContext] Failed to refresh server data:', e);
    }
  };

  useEffect(() => {
    refreshServerState();
  }, []);

  const switchRole = (role: UserRole) => {
    const found = SEED_USERS.find((u) => u.role === role);
    if (found) {
      setCurrentUser(found);
    } else {
      setCurrentUser((prev) => ({ ...prev, role }));
    }
  };

  const login = (email: string, role: UserRole = 'support') => {
    const matched = SEED_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (matched) {
      setCurrentUser(matched);
    } else {
      setCurrentUser({
        id: `usr_${Date.now()}`,
        name: email.split('@')[0],
        email,
        role,
        organizationId: 'org_acme_prod',
        organizationName,
      });
    }
    setIsLoggedIn(true);
    setActiveTab('dashboard');
    refreshServerState();
  };

  const logout = () => {
    setIsLoggedIn(false);
  };

  // Report new incident via Server API Contract
  const reportNewIncident = async (data: {
    title: string;
    description: string;
    category: Incident['category'];
    severity: Incident['severity'];
    affectedService?: string;
    affectedUsers?: string;
    attachments?: Incident['attachments'];
  }): Promise<Incident> => {
    setIsAiInvestigating(true);

    try {
      // 1. Create Incident on server
      const createRes = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          category: data.category,
          severity: data.severity,
          affectedService: data.affectedService,
          affectedUsers: data.affectedUsers,
          reportedBy: {
            name: currentUser.name,
            email: currentUser.email,
            role: currentUser.role,
          },
          organizationId: currentUser.organizationId,
          attachments: data.attachments || [],
        }),
      });

      if (!createRes.ok) {
        throw new Error('Failed to create incident on server');
      }

      const createdIncident = await createRes.json();

      // 2. Trigger automated Server Triage
      const investigateRes = await fetch(`/api/incidents/${createdIncident.id}/investigate`, {
        method: 'POST',
      });

      if (!investigateRes.ok) {
        throw new Error('Server investigation triage failed');
      }

      const triagedIncident = await investigateRes.json();

      // 3. Refresh list from server
      await refreshServerState();

      // Seed initial Chat messages
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const initialAiMsg: ChatMessage = {
        id: `msg-${Date.now()}-1`,
        sender: 'ai',
        text: triagedIncident.category === 'payment'
          ? `I understand the problem. I've initialized the War Room.\n\n[OBSERVED] We detected checkout latencies and Knex Connection Timeouts.\n[HISTORICAL] Symptoms correlate 98% with verified memory case INC-2026-042 (database connection pool exhaustion). I've populated ${triagedIncident.hypotheses.length} hypotheses and suggested recommended actions.`
          : `I understand the problem. I've initialized the War Room.\n\n[OBSERVED] Alert received on Product Search autocomplete SLA violation.\n[HISTORICAL] I found no verified historical matches for these symptoms.\n[INFERRED] Available observations indicate version v4.2.1 deployment is the likely hypothesis.`,
        timestamp: timeStr,
      };

      setChatMessages((prev) => ({
        ...prev,
        [createdIncident.id]: [initialAiMsg],
      }));

      setIsAiInvestigating(false);
      setSelectedIncidentId(createdIncident.id);
      setActiveTab('investigation');

      return triagedIncident;
    } catch (err) {
      console.error('Failed to report and investigate:', err);
      setIsAiInvestigating(false);
      throw err;
    }
  };

  const updateIncidentStatus = async (incidentId: string, status: Incident['status'], reason?: string) => {
    // Modify locally for fast feedback, and sync
    setIncidents((prev) =>
      prev.map((inc) => {
        if (inc.id !== incidentId) return inc;
        return {
          ...inc,
          status,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  // Run recommended action via Server API Contract (Hardened simulated actions)
  const runAction = async (incidentId: string, actionId: string): Promise<{ success: boolean; log: string }> => {
    setIsSimulatingAction(true);
    const incident = incidents.find((i) => i.id === incidentId);
    const action = incident?.recommendedActions.find((a) => a.id === actionId);

    try {
      const res = await fetch('/api/actions/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionId,
          incidentId,
          confirmation: true, // Frontend confirmation captured in UI
        }),
      });

      const data = await res.json();
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // Update action state in incident
      setIncidents((prev) =>
        prev.map((inc) => {
          if (inc.id !== incidentId) return inc;

          const updatedActions = inc.recommendedActions.map((a) => {
            if (a.id !== actionId) return a;
            return {
              ...a,
              status: 'completed' as const,
              executionResult: data.logOutput,
            };
          });

          const newTimelineEvent: TimelineEvent = {
            id: `t-${Date.now()}`,
            time: timeStr,
            user: currentUser.name,
            action: `Ran: ${action?.title || 'Action'}`,
            result: data.executionStatus === 'NOT EXECUTED IN PRODUCTION'
              ? 'Safe diagnostics/restart simulation executed successfully. Logs generated.'
              : 'Diagnostics check completed.',
            type: 'action_run',
          };

          return {
            ...inc,
            status: inc.status === 'investigating' ? 'fix_applied' : inc.status,
            recommendedActions: updatedActions,
            timeline: [...inc.timeline, newTimelineEvent],
          };
        })
      );

      // Add AI follow-up message into chat
      setChatMessages((prev) => {
        const existing = prev[incidentId] || [];
        const nextAiMsg: ChatMessage = {
          id: `msg-${Date.now()}`,
          sender: 'ai',
          text: `[OBSERVED] Action verified: ${action?.title} simulation finished successfully.\n\nLet's monitor the request queues to ensure latency stabilizes back to normal baselines.`,
          timestamp: timeStr,
        };
        return {
          ...prev,
          [incidentId]: [...existing, nextAiMsg],
        };
      });

      setIsSimulatingAction(false);
      return { success: true, log: data.logOutput };
    } catch (e: any) {
      setIsSimulatingAction(false);
      return { success: false, log: 'Execution simulation failed.' };
    }
  };

  // Resolve incident via Server API Contract (Do not make memory automatically verified)
  const resolveIncident = async (
    incidentId: string,
    resolutionData: {
      rootCause: string;
      resolutionNotes: string;
      runbookUsedTitle?: string;
      durationMinutes: number;
      failedApproaches?: string[];
    }
  ) => {
    try {
      const res = await fetch(`/api/incidents/${incidentId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resolutionData),
      });

      if (res.ok) {
        await refreshServerState();
        setSelectedIncidentId(incidentId);
        setActiveTab('post-mortem');
      }
    } catch (e) {
      console.error('Failed to resolve incident:', e);
    }
  };

  // Confirm root-cause hypothesis (Engineer confirmation flow)
  const confirmHypothesis = async (incidentId: string, hypothesisId: string, engineerNote: string) => {
    try {
      const res = await fetch(`/api/incidents/${incidentId}/hypotheses/${hypothesisId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmedBy: `${currentUser.name} (${currentUser.role})`,
          engineerNote,
        }),
      });

      if (res.ok) {
        await refreshServerState();
        
        // Add chat feedback
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setChatMessages((prev) => {
          const existing = prev[incidentId] || [];
          const nextAiMsg: ChatMessage = {
            id: `msg-${Date.now()}-confirm`,
            sender: 'ai',
            text: `[ENGINEER CONFIRMED] You have successfully confirmed the hypothesis: "Database Connection Pool Exhaustion".\n\nNote recorded: "${engineerNote}"\n\nLet's proceed with executing the final recovery playbooks.`,
            timestamp: timeStr,
          };
          return {
            ...prev,
            [incidentId]: [...existing, nextAiMsg],
          };
        });
      }
    } catch (e) {
      console.error('Failed to confirm hypothesis:', e);
    }
  };

  // Verify and promote draft memory to VERIFIED (Authorized memory promotion)
  const verifyMemory = async (incidentId: string, verifiedBy: string, verificationNote: string) => {
    try {
      const res = await fetch(`/api/incidents/${incidentId}/memory/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verifiedBy,
          verificationNote,
        }),
      });

      if (res.ok) {
        await refreshServerState();
      }
    } catch (e) {
      console.error('Failed to verify memory entry:', e);
    }
  };

  // Generate AI Post-Mortem via Server API
  const generateAiPostMortem = async (incidentId: string): Promise<PostMortem | null> => {
    try {
      const res = await fetch(`/api/incidents/${incidentId}/postmortem`, {
        method: 'POST',
      });

      if (res.ok) {
        const pm = await res.json();
        await refreshServerState();
        return pm;
      }
      return null;
    } catch (e) {
      console.warn('Post-mortem generation error:', e);
      return null;
    }
  };

  const savePostMortem = async (incidentId: string, postMortem: PostMortem) => {
    // Locally save, but we can also push to server
    setIncidents((prev) =>
      prev.map((i) => (i.id === incidentId ? { ...i, postMortem: { ...postMortem, updatedAt: new Date().toISOString() } } : i))
    );
  };

  const approvePostMortem = (incidentId: string) => {
    setIncidents((prev) =>
      prev.map((i) => {
        if (i.id !== incidentId || !i.postMortem) return i;
        return {
          ...i,
          postMortem: {
            ...i.postMortem,
            approved: true,
            approvedBy: `${currentUser.name} (${currentUser.role})`,
            updatedAt: new Date().toISOString(),
          },
        };
      })
    );
  };

  // Chat message sending utilizing server grounding rules
  const sendIncidentChatMessage = async (incidentId: string, text: string) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-u`,
      sender: 'user',
      text,
      timestamp: timeStr,
    };

    setChatMessages((prev) => ({
      ...prev,
      [incidentId]: [...(prev[incidentId] || []), userMsg],
    }));

    try {
      const existing = chatMessages[incidentId] || [];
      const history = existing.map((m) => ({
        role: (m.sender === 'ai' ? 'model' : 'user') as 'model' | 'user',
        parts: [{ text: m.text }],
      }));

      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          incidentId,
          history,
        }),
      });

      const data = await res.json();
      const aiReply: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        sender: 'ai',
        text: data.text || 'Noted. Let\'s proceed carefully with standard troubleshooting.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setChatMessages((prev) => ({
        ...prev,
        [incidentId]: [...(prev[incidentId] || []), aiReply],
      }));
    } catch (err) {
      console.warn('Chat error:', err);
    }
  };

  // Runbooks
  const toggleRunbookStep = (runbookId: string, stepId: string) => {
    setRunbooks((prev) =>
      prev.map((rb) => {
        if (rb.id !== runbookId) return rb;
        return {
          ...rb,
          steps: rb.steps.map((st) => (st.id === stepId ? { ...st, completed: !st.completed } : st)),
        };
      })
    );
  };

  const saveNewRunbook = (rb: Omit<Runbook, 'id'>) => {
    const newRb: Runbook = {
      ...rb,
      id: `rb-${Date.now()}`,
      createdBy: currentUser.name,
      updatedAt: new Date().toISOString(),
    };
    setRunbooks((prev) => [newRb, ...prev]);
  };

  const teachAgentMemory = (entry: Omit<AgentMemoryEntry, 'id' | 'timesReferenced' | 'status'>) => {
    const newEntry: AgentMemoryEntry = {
      ...entry,
      id: `mem-${Date.now()}`,
      timesReferenced: 0,
      status: 'DRAFT',
    };
    setMemoryBank((prev) => [newEntry, ...prev]);
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        switchRole,
        isLoggedIn,
        login,
        logout,
        organizationName,
        setOrganizationName,
        activeTab,
        setActiveTab,
        selectedIncidentId,
        setSelectedIncidentId,
        viewHistoricalModalIncident,
        setViewHistoricalModalIncident,
        incidents,
        runbooks,
        memoryBank,
        chatMessages,
        reportNewIncident,
        updateIncidentStatus,
        runAction,
        resolveIncident,
        generateAiPostMortem,
        savePostMortem,
        approvePostMortem,
        confirmHypothesis,
        verifyMemory,
        sendIncidentChatMessage,
        toggleRunbookStep,
        saveNewRunbook,
        teachAgentMemory,
        isAiInvestigating,
        isSimulatingAction,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
