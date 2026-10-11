export interface PlatformDashboardStats {
  totalUsers: number;
  totalCandidates: number;
  totalCompanyMembers: number;
  totalSuperAdmins: number;
  totalDisabledUsers: number;

  totalCompanies: number;
  pendingCompanies: number;
  approvedCompanies: number;
  rejectedCompanies: number;
  suspendedCompanies: number;

  totalJobs: number;
  publishedJobs: number;
  suspendedJobs: number;
  draftJobs: number;
  closedJobs: number;

  totalApplications: number;
  workSimTotalAssignments: number;
  workSimCompletedAssessments: number;
  workSimAverageScore: number | null;

  recentActivity: AdminAuditItem[];
}

export interface AdminUserSummary {
  id: string;
  email: string;
  fullName: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string | null;
  accountStatus: string;
  roles: string[];
  createdAtUtc: string;
  isCandidate: boolean;
  companyNames: string[];
}

export interface AdminUserDetail {
  id: string;
  email: string;
  fullName: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string | null;
  accountStatus: string;
  roles: string[];
  createdAtUtc: string;
  updatedAtUtc?: string | null;

  isCandidate: boolean;
  candidateHeadline?: string | null;
  candidateLocation?: string | null;
  yearsOfExperience?: number | null;
  applicationsCount: number;

  companyMemberships: AdminUserCompanyMembership[];
  recentAuditLogs: AdminAuditItem[];
}

export interface AdminUserCompanyMembership {
  companyId: string;
  companyName: string;
  role: string;
  status: string;
  joinedAtUtc: string;
}

export interface SuspendUserRequest {
  reason: string;
}

export interface AdminJobSummary {
  id: string;
  title: string;
  slug: string;
  companyId: string;
  companyName: string;
  categoryName: string;
  location: string;
  employmentType: string;
  workplaceType: string;
  status: string;
  publishedAtUtc?: string | null;
  moderationReason?: string | null;
  moderatedAtUtc?: string | null;
  moderatedByName?: string | null;
  applicationsCount: number;
  createdAtUtc: string;
}

export interface AdminJobDetail {
  id: string;
  title: string;
  slug: string;
  companyId: string;
  companyName: string;
  categoryName: string;
  summary: string;
  description: string;
  responsibilities: string;
  location: string;
  employmentType: string;
  workplaceType: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency: string;
  status: string;
  publishedAtUtc?: string | null;
  moderationReason?: string | null;
  moderatedAtUtc?: string | null;
  moderatedByName?: string | null;
  applicationsCount: number;
  createdAtUtc: string;
  updatedAtUtc?: string | null;

  requirements: AdminJobRequirement[];
  auditHistory: AdminAuditItem[];
}

export interface AdminJobRequirement {
  id: string;
  requirementText: string;
  category: string;
  type: string;
}

export interface SuspendJobRequest {
  reason: string;
}

export interface AdminAuditItem {
  id: string;
  actorUserId?: string | null;
  actorName?: string | null;
  actorEmail?: string | null;
  companyId?: string | null;
  companyName?: string | null;
  actionType: string;
  targetResource: string;
  targetResourceId: string;
  ipAddress?: string | null;
  metadataJson?: string | null;
  timestampUtc: string;
}

export interface AdminUserQueryParams {
  search?: string;
  role?: string;
  accountStatus?: string;
  page?: number;
  pageSize?: number;
}

export interface AdminJobQueryParams {
  search?: string;
  companyId?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface AdminAuditQueryParams {
  search?: string;
  actionType?: string;
  targetResource?: string;
  fromUtc?: string;
  toUtc?: string;
  page?: number;
  pageSize?: number;
}

export interface AdminCompanyQueryParams {
  search?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}
