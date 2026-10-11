export type DateRangePreset = '7d' | '30d' | '90d' | 'all' | 'custom';

export interface DateRangeFilter {
  preset?: DateRangePreset;
  startDateUtc?: string;
  endDateUtc?: string;
}

export interface FunnelStage {
  stageName: string;
  displayLabel: string;
  order: number;
  count: number;
  percentageOfTotal: number;
  conversionRateFromPrevious: number;
  dropOffCount: number;
}

export interface FunnelTerminalOutcome {
  outcomeName: string;
  displayLabel: string;
  count: number;
  percentageOfTotal: number;
}

export interface RecruitmentFunnel {
  totalApplications: number;
  stages: FunnelStage[];
  terminalOutcomes: FunnelTerminalOutcome[];
}

export interface StageDistributionItem {
  stage: number | string;
  stageName: string;
  displayLabel: string;
  count: number;
  percentage: number;
}

export interface ApplicationTrendPoint {
  date: string;
  applicationsCount: number;
}

export interface ScoreBucket {
  bucketLabel: string;
  minScore: number;
  maxScore: number;
  count: number;
  percentage: number;
}

export interface CriterionMetric {
  criterionName: string;
  averageScore: number;
  maxScore: number;
  averagePercentage: number;
}

export interface CompanyWorkSimMetrics {
  totalAssigned: number;
  completedCount: number;
  inProgressCount: number;
  pendingCount: number;
  expiredCount: number;
  cancelledCount: number;
  completionRatePercentage: number;
  averageCompletionMinutes: number | null;
  averageScore: number | null;
  scoreBuckets: ScoreBucket[];
  criteriaPerformance: CriterionMetric[];
}

export interface JobPerformanceSummary {
  jobId: string;
  jobTitle: string;
  status: string;
  publishedAtUtc: string | null;
  totalApplications: number;
  applicationsInPeriod: number;
  activeCount: number;
  hiredCount: number;
  rejectedCount: number;
  workSimAssignedCount: number;
  workSimCompletedCount: number;
  workSimCompletionRate: number;
}

export interface CompanyRecruitmentOverview {
  companyId: string;
  companyName: string;
  filterPreset: string;
  startDateUtc: string | null;
  endDateUtc: string | null;

  totalJobs: number;
  publishedJobs: number;
  draftJobs: number;
  closedJobs: number;

  totalApplications: number;
  applicationsInPeriod: number;
  activeApplications: number;
  hiredCount: number;
  rejectedCount: number;
  withdrawnCount: number;
  overallHireRatePercentage: number;

  funnel: RecruitmentFunnel;
  stageDistribution: StageDistributionItem[];
  activityTrend: ApplicationTrendPoint[];
  workSimMetrics: CompanyWorkSimMetrics;
  jobPerformance: JobPerformanceSummary[];
}

export interface JobDetailAnalytics {
  jobId: string;
  jobTitle: string;
  companyId: string;
  status: string;
  publishedAtUtc: string | null;
  totalApplications: number;
  applicationsInPeriod: number;
  activeCount: number;
  hiredCount: number;
  rejectedCount: number;
  withdrawnCount: number;

  funnel: RecruitmentFunnel;
  stageDistribution: StageDistributionItem[];
  activityTrend: ApplicationTrendPoint[];
  workSimMetrics: CompanyWorkSimMetrics;
}

export interface CompanyLeaderboardItem {
  companyId: string;
  companyName: string;
  activeJobsCount: number;
  totalApplicationsCount: number;
}

export interface PlatformAnalyticsOverview {
  generatedAtUtc: string;
  filterPreset: string;
  startDateUtc: string | null;
  endDateUtc: string | null;

  totalCandidates: number;
  totalCompanies: number;
  approvedCompanies: number;
  pendingCompanies: number;
  suspendedCompanies: number;

  totalJobs: number;
  publishedJobs: number;
  totalApplications: number;
  applicationsInPeriod: number;

  totalWorkSimAssignments: number;
  totalWorkSimCompletions: number;
  platformWorkSimCompletionRate: number;

  platformActivityTrend: ApplicationTrendPoint[];
  activeCompanies: CompanyLeaderboardItem[];
}
