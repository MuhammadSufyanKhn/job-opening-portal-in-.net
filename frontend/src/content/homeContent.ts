/**
 * Content definitions for HireSphere public pages.
 * Strictly honest product copy explaining candidate and employer workflows.
 * No fabricated recruitment data, fake applicants, or invented company lists.
 */

export interface HomeBenefit {
  iconName: 'shield' | 'spark' | 'clock' | 'award' | 'lock' | 'usercheck';
  title: string;
  description: string;
}

export const JOBSEEKER_BENEFITS: HomeBenefit[] = [
  {
    iconName: 'shield',
    title: 'Verified employers',
    description: 'Every company is vetted by administrators before posting, ensuring genuine opportunities.',
  },
  {
    iconName: 'spark',
    title: 'Skill matching evidence',
    description: 'Understand how your qualifications align with requirements before submitting your profile.',
  },
  {
    iconName: 'clock',
    title: 'Transparent tracking',
    description: 'Monitor your application status through each stage: Under Review, Assessment, Interview, and Offer.',
  },
  {
    iconName: 'award',
    title: 'Practical WorkSim trials',
    description: 'Complete hands-on, realistic task simulations to demonstrate practical abilities beyond your CV.',
  },
  {
    iconName: 'lock',
    title: 'Protected documents',
    description: 'Your uploaded CV and personal details are visible only to the organizations you choose to apply to.',
  },
  {
    iconName: 'usercheck',
    title: 'Human-centered decisions',
    description: 'Applications are reviewed directly by hiring managers, supported by structured evaluation rubrics.',
  },
];

export const EMPLOYER_CHECKLIST: string[] = [
  'Create and configure your verified company profile',
  'Publish detailed job postings with customized skill requirements',
  'Review candidate applications with automated skill matching evidence',
  'Attach interactive WorkSim assessment scenarios to evaluate practical ability',
  'Collaborate with team members using private hiring notes and ratings',
  'Manage candidates across a structured, multi-stage recruitment pipeline',
  'Schedule interviews and export compliant recruitment analytics',
];

export const HOW_IT_WORKS_STEPS = {
  seeker: [
    {
      stepNumber: 1,
      title: 'Build your profile & upload CV',
      description: 'Set up your professional credentials, target roles, and upload your resume for automatic skill extraction.',
    },
    {
      stepNumber: 2,
      title: 'Find verified openings & apply',
      description: 'Search open listings with real-time filters for location, workplace type, and salary range, then apply with one click.',
    },
    {
      stepNumber: 3,
      title: 'Complete WorkSim & track progress',
      description: 'Engage in realistic role scenarios if requested, monitor application milestones, and schedule interviews.',
    },
  ],
  employer: [
    {
      stepNumber: 1,
      title: 'Register & get verified',
      description: 'Submit your organization details for administrative verification to establish trust with jobseekers.',
    },
    {
      stepNumber: 2,
      title: 'Publish openings with requirements',
      description: 'Define roles, required skills, and optionally assign WorkSim interactive scenarios to evaluate real performance.',
    },
    {
      stepNumber: 3,
      title: 'Review, evaluate & hire',
      description: 'Sort candidates by objective skill alignment, review scenario results, collaborate with colleagues, and extend offers.',
    },
  ],
};

export interface FaqItem {
  question: string;
  answer: string;
}

export const HOME_FAQS: FaqItem[] = [
  {
    question: 'How does HireSphere ensure job postings are genuine?',
    answer: 'Every company registering on HireSphere must undergo an administrative approval review before any job postings can be published publicly. Postings from unverified or deactivated companies are not displayed.',
  },
  {
    question: 'How is my CV privacy protected?',
    answer: 'Your uploaded CV and profile information are strictly private. They are never indexed publicly or made searchable across the web. Only hiring members of companies to which you explicitly submit an application have access to review your documents.',
  },
  {
    question: 'What is a WorkSim skills challenge?',
    answer: 'WorkSim is an integrated simulation workspace where candidates complete realistic, time-bounded problem-solving scenarios reflecting actual daily tasks for the role. It provides hiring teams with objective evidence of your practical competencies.',
  },
  {
    question: 'Does an algorithm automatically reject my application?',
    answer: 'No. Skill matching percentages and keyword evidence provide informational guidance to both you and the hiring team. Final decisions to advance, interview, or reject applicants are always made manually by human hiring managers.',
  },
  {
    question: 'Which CV file formats and sizes are supported?',
    answer: 'You can securely upload documents in PDF (.pdf), Microsoft Word (.docx, .doc), or Plain Text (.txt) formats, up to 10 MB per file.',
  },
  {
    question: 'How do employer invitations and team collaboration work?',
    answer: 'Approved companies can invite team members as Admins, Recruiters, or Hiring Managers. Team members can leave private candidate notes, manage interview schedules, and assign WorkSim assessment scenarios.',
  },
];
