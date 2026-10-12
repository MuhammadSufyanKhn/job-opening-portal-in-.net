/**
 * User-facing labels and terminology for HireSphere.
 * All public and portal screens use plain, friendly language.
 * No developer jargon, AI/algorithm buzzwords, or technical architecture terms.
 */

export const LABELS = {
  // Primary feature labels
  SKILLS_CHALLENGE: 'Skills challenge',
  SKILLS_CHALLENGES: 'Skills challenges',
  SKILLS_CHALLENGE_DESC: 'A short, realistic work task',
  
  // Qualification match & fit
  MATCH_REPORT_TITLE: 'See how well you fit a job',
  MATCH_FIT: 'fit',
  MATCH_PERCENT: '% fit',
  
  // CV & document management
  MY_CVS: 'My CVs',
  YOUR_CVS_STAY_PRIVATE: 'Your CVs stay private',
  PRIVATE_CV_NOTE: 'Only the companies you apply to can see your CV. It is never public.',
  
  // Recruitment workflow & pipeline
  APPLICANT_BOARD: 'Applicant board',
  HIRING_INSIGHTS: 'Hiring insights',
  COMPANY_ACCOUNT: 'Company account',
  COMPANY_ACCOUNT_CHECKED: 'We check every company before its jobs go live, to keep scams out.',
  TEAM_NOTES_PRIVATE: "Only your organisation can see this",
  TEAM_NOTES_DESC: "Your team's notes are private and never shown to candidates.",
  
  // Decision reassurance
  REAL_PERSON_DECIDES: 'A real person decides',
  REAL_PERSON_DESC: 'No automatic rejections. Every application is looked at by a person.',
  ALWAYS_KNOW_STAND: 'Always know where you stand',
  ALWAYS_KNOW_DESC: 'Follow each application from sent to decision, with an update at every step.',
  VERIFIED_COMPANIES: 'Verified companies',
  VERIFIED_COMPANIES_DESC: 'Every company is checked before it can post a job, so you only see genuine openings.',
  
  // Stage labels
  STAGE_SUBMITTED: 'Submitted',
  STAGE_UNDER_REVIEW: 'Under review',
  STAGE_SHORTLISTED: 'Shortlisted',
  STAGE_CHALLENGE_TODO: 'Skills challenge to do',
  STAGE_CHALLENGE_DONE: 'Skills challenge done',
  STAGE_INTERVIEW: 'Interview scheduled',
  STAGE_OFFER: 'Offer extended',
  STAGE_HIRED: 'Hired',
  STAGE_REJECTED: 'Rejected',
  STAGE_WITHDRAWN: 'Withdrawn',
} as const;

export const SKILLS_CHALLENGE = LABELS.SKILLS_CHALLENGE;
export const SKILLS_CHALLENGES = LABELS.SKILLS_CHALLENGES;
export const MY_CVS = LABELS.MY_CVS;
export const APPLICANT_BOARD = LABELS.APPLICANT_BOARD;
export const HIRING_INSIGHTS = LABELS.HIRING_INSIGHTS;
