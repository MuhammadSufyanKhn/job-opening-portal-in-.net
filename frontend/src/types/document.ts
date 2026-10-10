export type ExtractionStatus = 
  | 'Pending' 
  | 'Processing' 
  | 'Success' 
  | 'Failed' 
  | 'ScannedPdfDetected';

export interface CandidateDocumentSummary {
  id: string;
  candidateProfileId: string;
  originalFileName: string;
  fileExtension: string;
  mimeType: string;
  fileSizeBytes: number;
  isDefault: boolean;
  versionNumber: number;
  rootDocumentId?: string | null;
  contentHash?: string | null;
  createdAtUtc: string;
  extractionStatus: ExtractionStatus | number;
  extractedSkillsCount: number;
}

export interface CandidateDocumentDetail extends CandidateDocumentSummary {
  extractedTextSnippet?: string | null;
  extractedSkills: string[];
  extractedCertifications: string[];
  extractedEducation: string[];
  estimatedYearsOfExperience?: number | null;
  versionsCount: number;
  extractionErrorMessage?: string | null;
}

export type MatchStatus = 
  | 'SupportedByEvidence' 
  | 'PartiallySupported' 
  | 'NotFound' 
  | 'RequiresManualReview'
  | number;

export interface CvRequirementEvaluation {
  id: string;
  jobRequirementId: string;
  requirementText: string;
  requirementCategory: number;
  requirementType: number;
  status: MatchStatus;
  confidenceLevel: number;
  extractedExcerpt?: string | null;
  reviewerNote?: string | null;
  reviewerOverriddenStatus?: MatchStatus | null;
}

export interface CvMatchSummary {
  totalRequirements: number;
  supportedCount: number;
  partiallySupportedCount: number;
  notFoundCount: number;
  needsReviewCount: number;
  mandatoryTotalCount: number;
  mandatoryFulfilledCount: number;
}

export interface CvMatchReport {
  id: string;
  jobApplicationId: string;
  jobTitle: string;
  candidateName: string;
  overallEvidenceIndex: number;
  engineVersion: string;
  calculationSummary: string;
  calculatedAtUtc: string;
  evaluations: CvRequirementEvaluation[];
  summary: CvMatchSummary;
}
