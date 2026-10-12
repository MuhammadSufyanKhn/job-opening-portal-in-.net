/**
 * Content definitions for the HireSphere public homepage.
 * Matches design-reference/hiresphere-home-v2.html.
 * 
 * Data honesty rules:
 * - Feature flags for placeholder/sample sections default to false so they stay hidden in production.
 * - Set flags to true when connected to live aggregates/real stories.
 */

// Production feature flags for preview/sample sections
export const HOME_FLAGS = {
  // TODO: replace with real data before launch
  showStatsStrip: false,
  // TODO: replace with real data before launch
  showMarketSection: false,
  // TODO: replace with real data before launch
  showTestimonials: false,
};

export interface HomeCategory {
  id: string;
  name: string;
  count: number;
  iconName: 'code' | 'pen' | 'trend' | 'briefcase' | 'chart' | 'msg' | 'layers' | 'usercheck';
}

export const HOME_CATEGORIES: HomeCategory[] = [
  { id: 'software-engineering', name: 'Software and IT', count: 412, iconName: 'code' },
  { id: 'design-creative', name: 'Design and creative', count: 168, iconName: 'pen' },
  { id: 'marketing-content', name: 'Marketing', count: 203, iconName: 'trend' },
  { id: 'sales-account-management', name: 'Sales', count: 241, iconName: 'briefcase' },
  { id: 'finance-accounting', name: 'Finance and accounting', count: 134, iconName: 'chart' },
  { id: 'customer-support-operations', name: 'Customer support', count: 189, iconName: 'msg' },
  { id: 'operations', name: 'Operations', count: 156, iconName: 'layers' },
  { id: 'healthcare', name: 'Healthcare', count: 97, iconName: 'usercheck' },
];

export interface HomeBenefit {
  iconName: 'shield' | 'spark' | 'clock' | 'award' | 'lock' | 'usercheck';
  title: string;
  description: string;
}

export const JOBSEEKER_BENEFITS: HomeBenefit[] = [
  {
    iconName: 'shield',
    title: 'Real companies only',
    description: 'Every company is checked before it can post a job, so you only see genuine openings.',
  },
  {
    iconName: 'spark',
    title: 'See your fit first',
    description: 'Find out how well your skills match a job before you spend time applying.',
  },
  {
    iconName: 'clock',
    title: 'Always know where you stand',
    description: 'Follow each application from sent to decision, with an update at every step.',
  },
  {
    iconName: 'award',
    title: 'Show what you can do',
    description: 'Some jobs invite you to a short, realistic work task, so you can stand out beyond your CV.',
  },
  {
    iconName: 'lock',
    title: 'Your CV stays private',
    description: 'Only the companies you apply to can see it. It is never public.',
  },
  {
    iconName: 'usercheck',
    title: 'A real person decides',
    description: 'No automatic rejections. Every application is looked at by a person.',
  },
];

export const EMPLOYER_CHECKLIST: string[] = [
  'Post a job in minutes, free of charge',
  'Reach people who are actively looking',
  'See how well each applicant fits your job',
  'Invite your best candidates to a short skills challenge',
  'Share private notes with your hiring team',
  'Follow every candidate from first look to offer',
  'Stand out with a verified company badge',
];

export const HOW_IT_WORKS_STEPS = {
  seeker: [
    {
      title: 'Create your free profile',
      description: 'Add your details and upload your CV. It takes about five minutes.',
    },
    {
      title: 'Search and apply',
      description: 'Browse jobs that fit you and apply with one click. We show how well you match.',
    },
    {
      title: 'Track and get hired',
      description: 'Follow every application, book interviews and hear back from the company.',
    },
  ],
  employer: [
    {
      title: 'Create your company account',
      description: 'Tell us about your company. We check every account to keep scams out.',
    },
    {
      title: 'Post your job',
      description: 'Describe the role and the skills you need. Add a short skills challenge if you like.',
    },
    {
      title: 'Review, interview and hire',
      description: 'See how well each person fits, share notes with your team and make an offer.',
    },
  ],
};

export interface HiringCompanySample {
  name: string;
  openJobs: number;
  colorClass: string;
}

export const HIRING_COMPANIES_SAMPLE: HiringCompanySample[] = [
  { name: 'Apex Cloud Systems', openJobs: 5, colorClass: 'm1' },
  { name: 'NovaSphere Technologies', openJobs: 8, colorClass: 'm2' },
  { name: 'Harbor Logistics', openJobs: 3, colorClass: 'm3' },
  { name: 'Northwind', openJobs: 6, colorClass: 'm4' },
  { name: 'Meridian Health', openJobs: 4, colorClass: 'm5' },
  { name: 'Orbit Labs', openJobs: 7, colorClass: 'm6' },
  { name: 'Kite Commerce', openJobs: 9, colorClass: 'm1' },
  { name: 'Brightpath Education', openJobs: 2, colorClass: 'm2' },
];

export interface FaqItem {
  question: string;
  answer: string;
}

export const HOME_FAQS: FaqItem[] = [
  {
    question: 'Is HireSphere really free?',
    answer: 'Yes. Jobseekers can search, apply and track applications for free, and companies can post jobs and review applicants for free.',
  },
  {
    question: 'Is my CV private?',
    answer: 'Yes. Your CV is not public and cannot be searched by other companies. A company only sees it when you apply to one of its jobs.',
  },
  {
    question: 'Will a computer reject my application?',
    answer: 'No. Our match score only helps you and the company understand how your skills fit a job. A real person makes every decision.',
  },
  {
    question: 'How do you check companies?',
    answer: 'Every new company is reviewed by our team before its jobs go live. This keeps fake and misleading jobs off the site.',
  },
  {
    question: 'What is a skills challenge?',
    answer: 'It is a short, realistic work task that some companies add to a job, like solving a small problem you would meet in the role. It lets you show your ability, not just your CV.',
  },
  {
    question: 'Which CV files can I upload?',
    answer: 'PDF and Word files up to 10 MB.',
  },
];

// Placeholder preview data for sections toggleable via flags
// TODO: replace with real data before launch
export const STATS_STRIP_DATA = [
  { value: '1,284', label: 'open jobs right now' },
  { value: '312', label: 'companies hiring' },
  { value: '48 hours', label: 'typical reply time' },
  { value: 'Free', label: 'for everyone' },
];

// TODO: replace with real data before launch
export const MARKET_DATA = {
  inDemand: [
    { title: 'Software developers', growth: 24 },
    { title: 'Customer support', growth: 18 },
    { title: 'Digital marketing', growth: 15 },
    { title: 'Data analysts', growth: 12 },
    { title: 'Sales', growth: 9 },
  ],
  salaries: [
    { role: 'Developer', starting: '$28k', experienced: '$75k' },
    { role: 'Designer', starting: '$22k', experienced: '$60k' },
    { role: 'Marketer', starting: '$18k', experienced: '$45k' },
    { role: 'Support', starting: '$14k', experienced: '$32k' },
    { role: 'Accountant', starting: '$16k', experienced: '$42k' },
  ],
  locations: [
    { city: 'Remote', count: 412 },
    { city: 'Karachi', count: 238 },
    { city: 'Lahore', count: 176 },
    { city: 'Islamabad', count: 98 },
    { city: 'London', count: 74 },
    { city: 'Dubai', count: 61 },
  ],
};

// TODO: replace with real data before launch
export const TESTIMONIALS_DATA = [
  {
    quote: 'I applied on Monday and had an interview by Friday. Being able to see where my application was made waiting so much easier.',
    name: 'Ayesha K.',
    role: 'Product designer',
    colorClass: 'm4',
  },
  {
    quote: 'We filled our support team in three weeks. Seeing how well each applicant fit saved us hours of reading CVs.',
    name: 'Sana M.',
    role: 'Hiring manager',
    colorClass: 'm1',
  },
  {
    quote: "The skills challenge let me show what I can do. I didn't have a long CV, but I still got the job.",
    name: 'Daniyal R.',
    role: 'Junior developer',
    colorClass: 'm2',
  },
];
