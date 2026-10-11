export type SimulationStatus = 'Active' | 'Submitted' | 'TimedOut' | 'Aborted';
export type AssignmentStatus = 'Assigned' | 'InProgress' | 'Completed' | 'Expired' | 'Cancelled';

export interface SimulationScenario {
  id: string;
  ownerCompanyId?: string | null;
  title: string;
  category: string;
  description: string;
  estimatedDurationMinutes: number;
  latestVersionNumber: number;
  latestVersionId: string;
  isActive: boolean;
  isCompanyOwned: boolean;
}

export interface AssessmentAssignment {
  assignmentId: string;
  jobApplicationId: string;
  jobTitle: string;
  companyName: string;
  scenarioId: string;
  scenarioTitle: string;
  scenarioCategory: string;
  scenarioDescription?: string;
  estimatedDurationMinutes: number;
  isRequired: boolean;
  maxAllowedAttempts: number;
  assignedAtUtc?: string;
  deadlineUtc: string;
  status: AssignmentStatus;
  reminderSentAtUtc?: string | null;
  cancelledAtUtc?: string | null;
  cancellationReason?: string | null;
  resentCount?: number;
  lastResentAtUtc?: string | null;
  activeSessionId?: string | null;
  resultId?: string | null;
  totalScore?: number | null;
  completedAtUtc?: string | null;
}

export interface SimulationEvidenceItem {
  evidenceKey: string;
  title: string;
  category: string;
  content: string;
}

export interface AvailableAction {
  actionKey: string;
  actionType: string;
  title: string;
  description: string;
  requiresRationale: boolean;
}

export interface SimulationActionHistoryItem {
  sequenceNumber: number;
  actionType: string;
  actionKey: string;
  actionTitle: string;
  candidateRationale?: string | null;
  elapsedMilliseconds: number;
  timestampUtc: string;
  feedbackMessage?: string | null;
}

export interface CandidateSimulationRuntimeState {
  sessionId: string;
  assignmentId: string;
  scenarioTitle: string;
  scenarioCategory: string;
  initialContext: string;
  currentTaskKey: string;
  currentTaskTitle: string;
  currentTaskInstructions: string;
  taskIndex: number;
  totalTasks: number;
  stateVariables: Record<string, string>;
  unlockedEvidence: SimulationEvidenceItem[];
  availableActions: AvailableAction[];
  actionHistory: SimulationActionHistoryItem[];
  totalActionsTaken: number;
  startedAtUtc: string;
  expiresAtUtc: string;
  isCompleted: boolean;
  status: SimulationStatus;
  resultId?: string | null;
}

export interface SubmitSimulationActionRequest {
  actionKey: string;
  candidateRationale?: string | null;
}

export interface SubmitSimulationActionResult {
  success: boolean;
  message: string;
  updatedState: CandidateSimulationRuntimeState;
  isCompleted: boolean;
  resultId?: string | null;
}

export interface CriterionScore {
  criterionName: string;
  score: number;
  maxScore: number;
  feedback: string;
  supportingEvidence: string[];
}

export interface AssessmentResult {
  resultId: string;
  sessionId: string;
  candidateProfileId: string;
  candidateName: string;
  scenarioTitle: string;
  scenarioCategory: string;
  totalScore: number;
  evaluationSummary: string;
  candidateFeedback: string;
  evaluatedAtUtc: string;
  criterionScores: CriterionScore[];
}

export interface JobAssessmentConfiguration {
  id: string;
  jobPostingId: string;
  scenarioVersionId: string;
  scenarioTitle: string;
  scenarioCategory: string;
  versionNumber: number;
  isRequired: boolean;
  maxAllowedAttempts: number;
  deadlineDaysAfterAssignment: number;
  createdAtUtc: string;
}

export interface AssignJobSimulationRequest {
  scenarioVersionId: string;
  isRequired: boolean;
  maxAllowedAttempts: number;
  deadlineDaysAfterAssignment: number;
}

export interface CompanyAssessmentTrackingItem {
  assignmentId: string;
  jobApplicationId: string;
  candidateProfileId: string;
  candidateName: string;
  candidateEmail: string;
  jobPostingId: string;
  jobTitle: string;
  scenarioTitle: string;
  scenarioCategory: string;
  isRequired: boolean;
  status: AssignmentStatus;
  assignedAtUtc: string;
  deadlineUtc: string;
  completedAtUtc?: string | null;
  reminderSentAtUtc?: string | null;
  cancelledAtUtc?: string | null;
  cancellationReason?: string | null;
  resentCount: number;
  lastResentAtUtc?: string | null;
  totalScore?: number | null;
  resultId?: string | null;
}

export interface InAppNotification {
  id: string;
  notificationType: string;
  title: string;
  message: string;
  actionUrl?: string | null;
  isRead: boolean;
  readAtUtc?: string | null;
  createdAtUtc: string;
}

export interface UnreadNotificationCount {
  unreadCount: number;
}

