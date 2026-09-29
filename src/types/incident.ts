export type UserRole = 'employee' | 'support' | 'admin';

export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';

export type IncidentCategory =
  | 'website'
  | 'mobile_app'
  | 'server'
  | 'database'
  | 'api'
  | 'payment'
  | 'auth'
  | 'other';

export type IncidentStatus =
  | 'reported'
  | 'investigating'
  | 'fix_applied'
  | 'monitoring'
  | 'resolved'
  | 'closed';

export interface TimelineEvent {
  id: string;
  time: string;
  user: string;
  action: string;
  result: string;
  type: 'status_change' | 'action_run' | 'ai_note' | 'comment';
}

export interface RecommendedAction {
  id: string;
  title: string;
  description: string;
  whyRecommended: string;
  previousSuccessHistory?: string;
  instructions: string;
  isDangerous: boolean;
  dangerousConfirmationText?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  executionResult?: string;
  runbookId?: string;
}

export interface RunbookStep {
  id: string;
  stepNumber: number;
  title: string;
  instruction: string;
  commandOrSnippet?: string;
  completed: boolean;
}

export interface Runbook {
  id: string;
  title: string;
  service: string;
  description: string;
  estimatedMinutes: number;
  tags: string[];
  steps: RunbookStep[];
  createdBy?: string;
  updatedAt?: string;
}

export interface PostMortem {
  id: string;
  incidentId: string;
  summary: string;
  impact: string;
  rootCause: string;
  resolution: string;
  whatWentWell: string[];
  whatDidNotWork: string[];
  preventiveActions: string[];
  lessonsLearned: string[];
  approved: boolean;
  approvedBy?: string;
  updatedAt: string;
}

export type MemoryStatus = 'DRAFT' | 'VERIFIED' | 'ARCHIVED';

export interface AgentMemoryEntry {
  id: string;
  incidentId: string;
  incidentTitle: string;
  service: string;
  symptoms: string[];
  rootCause: string;
  successfulFix: string;
  successfulRunbookId?: string;
  successfulRunbookTitle?: string;
  failedApproaches: string[];
  resolutionTimeMinutes: number;
  date: string;
  timesReferenced: number;
  lessonsLearned: string;
  status?: MemoryStatus;
  verifiedBy?: string;
  verifiedAt?: string;
  sourceIncidentId?: string;
  sourcePostMortemId?: string;
  verificationNote?: string;
}

export interface IncidentAttachment {
  name: string;
  size: string;
  type: string;
}

export type EvidenceType = 'LOG' | 'METRIC' | 'DEPLOYMENT' | 'ALERT' | 'SERVICE_HEALTH' | 'HISTORICAL_INCIDENT';

export interface EvidenceItem {
  id: string;
  type: EvidenceType;
  timestamp: string;
  service: string;
  title: string;
  value: string;
  details: string;
  source: string;
}

export type HypothesisStatus = 'OPEN' | 'LIKELY' | 'DISCOUNTED' | 'CONFIRMED';

export interface RootCauseHypothesis {
  id: string;
  incidentId: string;
  title: string;
  description: string;
  confidence: number;
  status: HypothesisStatus;
  supportingEvidenceIds: string[];
  contradictingEvidenceIds: string[];
  historicalIncidentIds: string[];
  investigationStepIds: string[];
  engineerConfirmationNote?: string;
  confirmedBy?: string;
  confirmedAt?: string;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
  status: IncidentStatus;
  affectedService: string;
  affectedUsers?: string;
  reportedBy: {
    name: string;
    email: string;
    role: UserRole;
  };
  assignedTo?: {
    name: string;
    email: string;
  };
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  durationMinutes?: number;
  rootCause?: string;
  resolutionNotes?: string;
  runbookUsedId?: string;
  runbookUsedTitle?: string;
  failedApproaches?: string[];
  timeline: TimelineEvent[];
  recommendedActions: RecommendedAction[];
  similarIncidentIds: string[];
  postMortem?: PostMortem;
  attachments?: IncidentAttachment[];
  evidence?: EvidenceItem[];
  hypotheses?: RootCauseHypothesis[];
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  organizationId: string;
  organizationName: string;
}

export interface ChatMessage {
  id: string;
  sender: 'ai' | 'user' | 'system';
  text: string;
  timestamp: string;
  suggestedActionId?: string;
  actionCard?: {
    actionId: string;
    title: string;
    isDangerous: boolean;
  };
}
