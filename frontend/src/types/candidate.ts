import type { ApplicationStage } from './recruitment';

export interface CandidateDashboardApplication {
  applicationId: string;
  jobPostingId: string;
  jobTitle: string;
  companyName: string;
  companyLogoUrl?: string;
  currentStage: ApplicationStage;
  submittedAtUtc: string;
  stageUpdatedAtUtc?: string;
}

export interface CandidateDashboardAssessment {
  assignmentId: string;
  jobApplicationId: string;
  scenarioTitle: string;
  category: string;
  companyName: string;
  jobTitle: string;
  deadlineUtc: string;
  status: string | number;
  isExpired: boolean;
}

export interface SavedJobSummary {
  savedJobId: string;
  jobId: string;
  title: string;
  companyName: string;
  companyLogoUrl?: string;
  location: string;
  employmentType: number | string;
  workplaceType: number | string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency: string;
  savedAtUtc: string;
  expiresAtUtc?: string;
  isActive: boolean;
}

export interface CandidateDashboard {
  candidateProfileId: string;
  fullName: string;
  profileCompletionPercentage: number;
  missingProfileFields: string[];
  // CV summary
  hasPrimaryCv: boolean;
  primaryCvId?: string;
  primaryCvFileName?: string;
  primaryCvUploadedAtUtc?: string;
  primaryCvExtractionStatus?: number | string;
  extractedSkillsCount: number;
  // Applications overview
  totalApplications: number;
  activeApplications: number;
  completedApplications: number;
  applicationsByStage: Record<string, number>;
  recentApplications: CandidateDashboardApplication[];
  // Assessments overview
  pendingAssessmentsCount: number;
  nextAssessmentDeadlineUtc?: string;
  pendingAssessments: CandidateDashboardAssessment[];
  // Saved jobs
  totalSavedJobs: number;
  savedJobs: SavedJobSummary[];
}

export interface ExtractedCvSuggestions {
  documentId: string;
  fileName: string;
  extractionStatus: number | string;
  extractedSkills: string[];
  extractedEducation: string[];
  extractedCertifications: string[];
  estimatedYearsOfExperience?: number;
  errorMessage?: string;
}
