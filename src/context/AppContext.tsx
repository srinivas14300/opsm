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
import {
  SEED_USERS,
  SEED_RUNBOOKS,
  SEED_AGENT_MEMORY,
  SEED_HISTORICAL_INCIDENTS,
  INITIAL_ACTIVE_INCIDENTS,
} from '../data/seedData';

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

  // Chat
  sendIncidentChatMessage: (incidentId: string, text: string) => Promise<void>;

  // Runbook step toggling
  toggleRunbookStep: (runbookId: string, stepId: string) => void;
  saveNewRunbook: (runbook: Omit<Runbook, 'id'>) => void;
  teachAgentMemory: (entry: Omit<AgentMemoryEntry, 'id' | 'timesReferenced'>) => void;

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

  const [incidents, setIncidents] = useState<Incident[]>(() => {
    return [...INITIAL_ACTIVE_INCIDENTS, ...SEED_HISTORICAL_INCIDENTS];
  });
  const [runbooks, setRunbooks] = useState<Runbook[]>(SEED_RUNBOOKS);
  const [memoryBank, setMemoryBank] = useState<AgentMemoryEntry[]>(SEED_AGENT_MEMORY);
  
  const [chatMessages, setChatMessages] = useState<Record<string, ChatMessage[]>>({
    'INC-2026-088': [
      {
        id: 'msg-1',
        sender: 'ai',
        text: 'I understand the problem. I\'ll help you investigate it.\n\nI analyzed your report and matched it to a previous incident from March 2026. Database connection pool exhaustion caused this exact payment stall. I have prepared recommended steps below.',
        timestamp: '06:42 AM',
      },
      {
        id: 'msg-2',
        sender: 'ai',
        text: 'Quick question to verify: Are customers seeing a 504 Gateway Timeout or a 500 Internal Server Error?',
        timestamp: '06:43 AM',
      },
    ],
  });

  const [isAiInvestigating, setIsAiInvestigating] = useState(false);
  const [isSimulatingAction, setIsSimulatingAction] = useState(false);

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
  };

  const logout = () => {
    setIsLoggedIn(false);
  };

  // Report new incident with AI investigation
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

    const now = new Date();
    const incidentId = `INC-2026-${Math.floor(100 + Math.random() * 900)}`;
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let serviceName = data.affectedService || (data.category === 'payment' ? 'Payment Service' : data.category === 'database' ? 'Database (PostgreSQL Primary)' : data.category === 'api' ? 'API Gateway' : 'Application Core');

    // Call server-side investigation endpoint
    let aiResponse: any = null;
    try {
      const res = await fetch('/api/gemini/investigate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: data.description,
          category: data.category,
          severity: data.severity,
          memoryBank: memoryBank.map((m) => ({
            id: m.id,
            incidentTitle: m.incidentTitle,
            service: m.service,
            symptoms: m.symptoms,
            rootCause: m.rootCause,
            successfulFix: m.successfulFix,
            resolutionTimeMinutes: m.resolutionTimeMinutes,
          })),
        }),
      });
      if (res.ok) {
        aiResponse = await res.json();
        if (aiResponse.identifiedService) {
          serviceName = aiResponse.identifiedService;
        }
      }
    } catch (err) {
      console.warn('Backend investigate call error:', err);
    }

    const matchedMemory = memoryBank.find((m) => m.id === aiResponse?.matchedMemoryId);
    const similarIncidentIds: string[] = matchedMemory ? [matchedMemory.incidentId] : [];

    const recommendedActions: RecommendedAction[] = aiResponse?.recommendedActions && aiResponse.recommendedActions.length > 0
      ? aiResponse.recommendedActions.map((act: any, idx: number) => ({
          id: act.id || `act-${idx + 1}`,
          title: act.title,
          description: act.description,
          whyRecommended: act.whyRecommended,
          previousSuccessHistory: act.previousSuccessHistory,
          instructions: act.instructions,
          isDangerous: Boolean(act.isDangerous),
          dangerousConfirmationText: act.dangerousConfirmationText || (act.isDangerous ? `⚠️ This action will restart or modify ${serviceName}. Confirm you want to run this.` : undefined),
          status: 'pending',
          runbookId: act.runbookId || (data.category === 'payment' ? 'rb-pay-01' : data.category === 'database' ? 'rb-db-02' : undefined),
        }))
      : [
          {
            id: 'act-1',
            title: `Check ${serviceName} health metrics`,
            description: 'Inspect status endpoint and active connection queue.',
            whyRecommended: 'AI suggestion: Isolates local server issues from external network stalls.',
            previousSuccessHistory: 'Standard diagnostic protocol.',
            instructions: 'Verify if HTTP health probe responds within 200ms.',
            isDangerous: false,
            status: 'pending',
          },
          {
            id: 'act-2',
            title: `Inspect logs for ${serviceName}`,
            description: 'Search for recent exceptions or timeouts in the last 15 minutes.',
            whyRecommended: 'AI suggestion: Locates exact stack traces and error codes.',
            previousSuccessHistory: 'Identified root cause in 95% of past investigations.',
            instructions: 'Review stderr logs in cloud monitoring console.',
            isDangerous: false,
            status: 'pending',
          },
        ];

    const timeline: TimelineEvent[] = [
      {
        id: `t-${Date.now()}-1`,
        time: timeStr,
        user: currentUser.name,
        action: 'Reported incident',
        result: `Severity marked as ${data.severity.toUpperCase()}`,
        type: 'status_change',
      },
      {
        id: `t-${Date.now()}-2`,
        time: timeStr,
        user: 'Incident IQ',
        action: 'Analyzed report & searched memory',
        result: aiResponse?.similarityExplanation || 'Memory search completed. Formulated recommended actions.',
        type: 'ai_note',
      },
    ];

    const newIncident: Incident = {
      id: incidentId,
      title: data.title,
      description: data.description,
      category: data.category,
      severity: aiResponse?.assessedSeverity || data.severity,
      status: 'investigating',
      affectedService: serviceName,
      affectedUsers: data.affectedUsers || 'Impacted users under assessment',
      reportedBy: {
        name: currentUser.name,
        email: currentUser.email,
        role: currentUser.role,
      },
      assignedTo: {
        name: currentUser.name,
        email: currentUser.email,
      },
      organizationId: currentUser.organizationId,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      similarIncidentIds,
      timeline,
      recommendedActions,
      attachments: data.attachments || [],
    };

    setIncidents((prev) => [newIncident, ...prev]);

    // Initial AI greeting message in chat
    const initialAiMsg: ChatMessage = {
      id: `msg-${Date.now()}-1`,
      sender: 'ai',
      text: aiResponse?.analysisSummary
        ? `${aiResponse.analysisSummary}\n\n${aiResponse.similarityExplanation}`
        : `I understand the problem. I'll help you investigate it.\n\nI have reviewed the symptoms for ${serviceName} and prepared recommended resolution steps.`,
      timestamp: timeStr,
    };

    const initialQuestionMsg: ChatMessage | null = aiResponse?.oneFollowUpQuestion
      ? {
          id: `msg-${Date.now()}-2`,
          sender: 'ai',
          text: aiResponse.oneFollowUpQuestion,
          timestamp: timeStr,
        }
      : null;

    setChatMessages((prev) => ({
      ...prev,
      [incidentId]: initialQuestionMsg ? [initialAiMsg, initialQuestionMsg] : [initialAiMsg],
    }));

    setIsAiInvestigating(false);
    setSelectedIncidentId(incidentId);
    setActiveTab('investigation');

    return newIncident;
  };

  // Update status (e.g. Reported -> Investigating -> Fix Applied -> Monitoring -> Resolved)
  const updateIncidentStatus = (incidentId: string, status: Incident['status'], reason?: string) => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setIncidents((prev) =>
      prev.map((inc) => {
        if (inc.id !== incidentId) return inc;
        const newTimelineEvent: TimelineEvent = {
          id: `t-${Date.now()}`,
          time: now,
          user: currentUser.name,
          action: `Status changed to ${status.replace('_', ' ').toUpperCase()}`,
          result: reason || `Updated by ${currentUser.name} (${currentUser.role})`,
          type: 'status_change',
        };
        return {
          ...inc,
          status,
          updatedAt: new Date().toISOString(),
          timeline: [...inc.timeline, newTimelineEvent],
        };
      })
    );
  };

  // Run recommended action
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
          title: action?.title || 'Diagnostic action',
          isDangerous: Boolean(action?.isDangerous),
          serviceName: incident?.affectedService || 'Service',
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
            result: action?.isDangerous
              ? 'Authorized rolling restart executed. All containers reported healthy.'
              : 'Diagnostics check completed with clean telemetry.',
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
          text: action?.isDangerous
            ? `Action verified: ${action.title} finished successfully. Let's keep monitoring the latency for 2 minutes to confirm full recovery.`
            : `Completed: ${action?.title || 'Step'}. The output looks nominal. Next, we can proceed to the remaining runbook verification.`,
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

  // Resolve incident
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
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let resolvedIncidentObj: Incident | undefined;

    setIncidents((prev) =>
      prev.map((inc) => {
        if (inc.id !== incidentId) return inc;
        const newTimelineEvent: TimelineEvent = {
          id: `t-${Date.now()}`,
          time: timeStr,
          user: currentUser.name,
          action: 'Incident marked as Resolved',
          result: `Root Cause: ${resolutionData.rootCause}`,
          type: 'status_change',
        };

        const updated: Incident = {
          ...inc,
          status: 'resolved',
          resolvedAt: now.toISOString(),
          durationMinutes: resolutionData.durationMinutes || 12,
          rootCause: resolutionData.rootCause,
          resolutionNotes: resolutionData.resolutionNotes,
          runbookUsedTitle: resolutionData.runbookUsedTitle,
          failedApproaches: resolutionData.failedApproaches || [],
          timeline: [...inc.timeline, newTimelineEvent],
        };
        resolvedIncidentObj = updated;
        return updated;
      })
    );

    // Save into Agent Memory Bank
    const memoryEntryId = `mem-${Date.now()}`;
    const newMemoryEntry: AgentMemoryEntry = {
      id: memoryEntryId,
      incidentId,
      incidentTitle: resolvedIncidentObj?.title || `Incident ${incidentId}`,
      service: resolvedIncidentObj?.affectedService || 'Service',
      symptoms: [
        resolvedIncidentObj?.description || 'Service degradation',
        `Category: ${resolvedIncidentObj?.category || 'other'}`,
      ],
      rootCause: resolutionData.rootCause,
      successfulFix: resolutionData.resolutionNotes,
      successfulRunbookTitle: resolutionData.runbookUsedTitle,
      failedApproaches: resolutionData.failedApproaches || [],
      resolutionTimeMinutes: resolutionData.durationMinutes || 12,
      date: now.toISOString().split('T')[0],
      timesReferenced: 1,
      lessonsLearned: `Documented during incident ${incidentId}. Maintain proactive metrics on ${resolvedIncidentObj?.affectedService || 'production'}.`,
    };

    setMemoryBank((prev) => [newMemoryEntry, ...prev]);

    // Generate AI Post-Mortem draft automatically
    if (resolvedIncidentObj) {
      await generateAiPostMortem(incidentId);
    }
  };

  // Generate AI Post-Mortem
  const generateAiPostMortem = async (incidentId: string): Promise<PostMortem | null> => {
    const inc = incidents.find((i) => i.id === incidentId);
    if (!inc) return null;

    try {
      const res = await fetch('/api/gemini/post-mortem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incidentTitle: inc.title,
          incidentDescription: inc.description,
          affectedService: inc.affectedService,
          severity: inc.severity,
          durationMinutes: inc.durationMinutes || 15,
          rootCause: inc.rootCause || 'Database connection pool saturation',
          resolutionNotes: inc.resolutionNotes || 'Applied rolling restart and cleared deadlock',
          runbookUsed: inc.runbookUsedTitle || 'Service Recovery',
          timeline: inc.timeline.map((t) => ({ time: t.time, action: t.action, result: t.result })),
        }),
      });

      const pmData = await res.json();
      const postMortem: PostMortem = {
        id: `pm-${Date.now()}`,
        incidentId,
        summary: pmData.summary || `${inc.title} caused a temporary disruption for ${inc.durationMinutes || 15} minutes.`,
        impact: pmData.impact || inc.affectedUsers || 'Customers experienced delayed requests.',
        rootCause: pmData.rootCause || inc.rootCause || 'Connection pool exhausted under load.',
        resolution: pmData.resolution || inc.resolutionNotes || 'Executed recovery runbook and restored throughput.',
        whatWentWell: pmData.whatWentWell || ['Rapid AI retrieval of similar historical incident', 'Zero data loss during rolling restart'],
        whatDidNotWork: pmData.whatDidNotWork || ['Alert threshold fired late', 'Initial manual triage delay'],
        preventiveActions: pmData.preventiveActions || ['Increase pool buffer by 50%', 'Add auto-reconnect logic'],
        lessonsLearned: pmData.lessonsLearned || ['Maintain proactive isolation between reporting and transactional queries.'],
        approved: false,
        updatedAt: new Date().toISOString(),
      };

      setIncidents((prev) =>
        prev.map((i) => (i.id === incidentId ? { ...i, postMortem } : i))
      );

      return postMortem;
    } catch (e) {
      console.warn('Post-mortem generation error:', e);
      return null;
    }
  };

  const savePostMortem = (incidentId: string, postMortem: PostMortem) => {
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

  // Chat message sending
  const sendIncidentChatMessage = async (incidentId: string, text: string) => {
    const inc = incidents.find((i) => i.id === incidentId);
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
          history,
          incidentTitle: inc?.title,
          incidentService: inc?.affectedService,
          incidentStatus: inc?.status,
          rootCause: inc?.rootCause,
          completedActions: inc?.recommendedActions
            .filter((a) => a.status === 'completed')
            .map((a) => a.title),
        }),
      });

      const data = await res.json();
      const aiReply: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        sender: 'ai',
        text: data.text || 'I have noted your update. Let\'s proceed with the next step in our recovery plan.',
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

  const teachAgentMemory = (entry: Omit<AgentMemoryEntry, 'id' | 'timesReferenced'>) => {
    const newEntry: AgentMemoryEntry = {
      ...entry,
      id: `mem-${Date.now()}`,
      timesReferenced: 0,
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
