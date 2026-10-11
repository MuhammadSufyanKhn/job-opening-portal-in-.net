export interface CompanyMembership {
  companyId: string;
  companyName: string;
  companySlug: string;
  companyRole: 'Owner' | 'Recruiter' | 'HiringManager';
  membershipStatus: string;
  approvalStatus: 'PendingApproval' | 'Approved' | 'Rejected' | 'Suspended';
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phoneNumber?: string;
  accountStatus: string;
  roles: string[];
  companies: CompanyMembership[];
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresAtUtc: string;
  user: User;
}

export interface CandidateProfile {
  id: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  headline?: string;
  summary?: string;
  location?: string;
  yearsOfExperience?: number;
  linkedInUrl?: string;
  gitHubUrl?: string;
  portfolioUrl?: string;
  phoneNumber?: string;
  completionPercentage?: number;
  missingFields?: string[];
  updatedAtUtc?: string;
}

export interface CompanyMember {
  id: string;
  companyId: string;
  userId: string;
  email: string;
  fullName: string;
  companyRole: string;
  membershipStatus: string;
  joinedAtUtc: string;
}

export interface CompanyReview {
  id: string;
  name: string;
  slug: string;
  businessRegistrationNumber?: string;
  websiteUrl?: string;
  industry: string;
  contactEmail: string;
  approvalStatus: 'PendingApproval' | 'Approved' | 'Rejected' | 'Suspended';
  rejectionReason?: string;
  ownerName: string;
  ownerEmail: string;
  createdAtUtc: string;
}
