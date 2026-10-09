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
  statusTimeline: ApplicationStatusHistory[];
}
