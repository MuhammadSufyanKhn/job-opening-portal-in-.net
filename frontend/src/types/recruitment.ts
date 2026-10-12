export type JobPostingStatus = 'Draft' | 'Published' | 'Paused' | 'Closed' | 'Archived' | number;
export type EmploymentType = 'FullTime' | 'PartTime' | 'Contract' | 'Internship' | number;
export type WorkplaceType = 'OnSite' | 'Hybrid' | 'Remote' | number;
export type RequirementCategory = 'Skill' | 'Experience' | 'Education' | 'Certification' | number;
export type RequirementType = 'Mandatory' | 'Preferred' | number;
export type ApplicationStage = 
  | 'Submitted' 
  | 'UnderReview' 
  | 'Shortlisted' 
  | 'AssessmentPending' 
  | 'AssessmentCompleted' 
  | 'InterviewScheduled' 
  | 'Offered' 
  | 'Hired' 
  | 'Rejected' 
  | 'Withdrawn'
  | number;

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface JobCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  displayOrder: number;
  openJobsCount?: number;
}

export interface JobRequirement {
  id: string;
  requirementText: string;
  requirementCategory: RequirementCategory;
  requirementType: RequirementType;
  displayOrder: number;
}

export interface CreateJobRequirementDto {
  requirementText: string;
  requirementCategory: RequirementCategory;
  requirementType: RequirementType;
  displayOrder: number;
}

export interface JobPostingSummary {
  id: string;
  companyId: string;
  companyName: string;
  jobCategoryId: number;
  categoryName: string;
  title: string;
  slug: string;
  summary: string;
  employmentType: EmploymentType;
  workplaceType: WorkplaceType;
  location: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency: string;
  status: JobPostingStatus;
  publishedAtUtc?: string;
  expiresAtUtc?: string;
  activeVersionNumber: number;
  applicationCount: number;
  createdAtUtc: string;
  updatedAtUtc?: string;
}

export interface JobPostingDetail extends JobPostingSummary {
  companySlug: string;
  companyLogoUrl?: string;
  description: string;
  responsibilities: string;
  requirements: JobRequirement[];
  versionCount: number;
}

export interface PublicJobPostingSummary {
  id: string;
  companyId: string;
  companyName: string;
  companyLogoUrl?: string;
  categoryName: string;
  title: string;
  slug: string;
  summary: string;
  employmentType: EmploymentType;
  workplaceType: WorkplaceType;
  location: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency: string;
  publishedAtUtc?: string;
  expiresAtUtc?: string;
  topSkills?: string[];
}

export interface PublicJobPostingDetail extends PublicJobPostingSummary {
  companyWebsiteUrl?: string;
  companyIndustry: string;
  description: string;
  responsibilities: string;
  requirements: JobRequirement[];
}

export interface ApplicationStatusHistory {
  id: string;
  previousStage: ApplicationStage;
  newStage: ApplicationStage;
  changedByName: string;
  reasonNote?: string;
  createdAtUtc: string;
}

export interface CandidateApplicationSummary {
  id: string;
  jobPostingId: string;
  jobTitle: string;
  jobSlug: string;
  companyId: string;
  companyName: string;
  currentStage: ApplicationStage;
  submittedAtUtc: string;
  stageUpdatedAtUtc?: string;
}

export interface CandidateApplicationDetail extends CandidateApplicationSummary {
  jobLocation: string;
  workplaceType: WorkplaceType;
  employmentType: EmploymentType;
  candidateCoverNote?: string;
  statusTimeline: ApplicationStatusHistory[];
  assessment?: import('./worksim').AssessmentAssignment | null;
}

export interface CompanyApplicationSummary {
  id: string;
  jobPostingId: string;
  jobTitle: string;
  candidateProfileId: string;
  candidateName: string;
  candidateEmail: string;
  candidateHeadline?: string;
  candidateLocation?: string;
  yearsOfExperience?: number;
  currentStage: ApplicationStage;
  submittedAtUtc: string;
  stageUpdatedAtUtc?: string;
}

export interface CompanyApplicationDetail extends CompanyApplicationSummary {
  candidateSummary?: string;
  linkedInUrl?: string;
  gitHubUrl?: string;
  portfolioUrl?: string;
  candidateCoverNote?: string;
  candidateDocumentId?: string | null;
  candidateDocumentFileName?: string | null;
  statusTimeline: ApplicationStatusHistory[];
  assessment?: import('./worksim').AssessmentAssignment | null;
  notes?: CandidateNote[] | null;
  interviews?: InterviewSchedule[] | null;
}

// --- Recruiter Notes ---
export interface CandidateNote {
  id: string;
  companyId: string;
  jobApplicationId: string;
  authorUserId: string;
  authorName: string;
  noteText: string;
  createdAtUtc: string;
  updatedAtUtc?: string | null;
}

export interface CreateCandidateNoteRequest {
  noteText: string;
}

// --- Interview Coordination ---
export type InterviewType = 'Screening' | 'Technical' | 'Cultural' | 'Final' | number;
export type InterviewStatus = 'Scheduled' | 'Completed' | 'Rescheduled' | 'Canceled' | number;

export interface InterviewSchedule {
  id: string;
  companyId: string;
  jobApplicationId: string;
  candidateName: string;
  jobTitle: string;
  interviewType: InterviewType;
  scheduledStartUtc: string;
  scheduledEndUtc: string;
  meetingLocation?: string | null;
  status: InterviewStatus;
  createdAtUtc: string;
  updatedAtUtc?: string | null;
}

export interface ScheduleInterviewRequest {
  interviewType: number;
  scheduledStartUtc: string;
  scheduledEndUtc: string;
  meetingLocation?: string;
}

export interface UpdateInterviewRequest {
  interviewType: number;
  scheduledStartUtc: string;
  scheduledEndUtc: string;
  meetingLocation?: string;
  status: number;
}

// --- Applicant Board ---
export interface PipelineBoardCard {
  id: string;
  jobPostingId: string;
  jobTitle: string;
  candidateProfileId: string;
  candidateName: string;
  candidateEmail: string;
  candidateHeadline?: string;
  candidateLocation?: string;
  yearsOfExperience?: number;
  currentStage: ApplicationStage;
  submittedAtUtc: string;
  stageUpdatedAtUtc?: string;
  matchEvidenceIndex?: number | null;
  workSimScore?: number | null;
}

export interface PipelineBoardStageColumn {
  stage: ApplicationStage;
  stageName: string;
  count: number;
  applications: PipelineBoardCard[];
}

export interface PipelineBoard {
  companyId: string;
  jobPostingId?: string | null;
  totalApplications: number;
  stages: PipelineBoardStageColumn[];
}

// --- Company Recruitment Workspace Dashboard ---
export interface WorkspaceJobSummary {
  id: string;
  title: string;
  slug: string;
  status: JobPostingStatus;
  applicationCount: number;
  createdAtUtc: string;
}

export interface RecruitmentTaskItem {
  id: string;
  type: string;
  title: string;
  description: string;
  actionUrl: string;
  severity: 'info' | 'warning' | 'danger';
}

export interface CompanyWorkspaceDashboard {
  companyId: string;
  companyName: string;
  activeJobsCount: number;
  pendingReviewCount: number;
  shortlistedCount: number;
  upcomingInterviewsCount: number;
  pendingAssessmentsCount: number;
  activeJobListings: WorkspaceJobSummary[];
  upcomingInterviews: InterviewSchedule[];
  recentApplications: CompanyApplicationSummary[];
  actionItems: RecruitmentTaskItem[];
}

// --- Public Company Directory ---
export interface PublicCompanySummary {
  id: string;
  name: string;
  slug: string;
  websiteUrl?: string | null;
  logoUrl?: string | null;
  industry: string;
  companySize?: string | null;
  description?: string | null;
  openJobsCount: number;
}

export interface PublicCompanyDirectoryResult {
  items: PublicCompanySummary[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

