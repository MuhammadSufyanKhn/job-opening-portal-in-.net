import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  HelpCircle, 
  Search, 
  ChevronDown, 
  Mail, 
  ArrowRight, 
  ShieldCheck, 
  Building2, 
  User, 
  Sparkles 
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { PageTransition } from '../components/common/PageTransition';

interface FaqCategory {
  id: string;
  name: string;
  icon: any;
  items: { question: string; answer: string }[];
}

export const HelpFaq: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({ 'cat-0-0': true });

  const toggleItem = (key: string) => {
    setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const categories: FaqCategory[] = [
    {
      id: 'general',
      name: 'General & Accounts',
      icon: User,
      items: [
        {
          question: 'Is HireSphere free for jobseekers and employers?',
          answer: 'Yes. Candidates can create profiles, upload resumes, search vacancies, take WorkSim simulations, and track applications completely free of charge. Employers can configure company profiles, publish listings, and evaluate candidates without hidden upfront subscriptions.',
        },
        {
          question: 'What roles exist within a company organization account?',
          answer: 'Organizations support three active team roles: Admin (manages company profile, invites colleagues, posts jobs), Recruiter (creates jobs, reviews candidates, coordinates interviews), and Hiring Manager (evaluates assigned applicants and leaves evaluation notes).',
        },
      ],
    },
    {
      id: 'privacy',
      name: 'Document Privacy & Security',
      icon: ShieldCheck,
      items: [
        {
          question: 'Who can view my uploaded CV and personal details?',
          answer: 'Your uploaded resumes and private profile contact details are never made publicly searchable across the web or visible to arbitrary companies. Only verified team members of employers to which you have directly submitted an application have authorization to view your credentials.',
        },
        {
          question: 'How are uploaded documents securely stored?',
          answer: 'Documents (PDF, DOCX, TXT) are securely validated against allowed MIME types and file extensions, encrypted in storage, and isolated per applicant ID. Automated anti-malware and file size limits (up to 10 MB) are enforced.',
        },
      ],
    },
    {
      id: 'worksim',
      name: 'WorkSim Skills Simulations',
      icon: Sparkles,
      items: [
        {
          question: 'What is a WorkSim assessment challenge?',
          answer: 'WorkSim is an integrated interactive evaluation workspace where candidates solve realistic, time-bounded problem scenarios reflecting actual daily tasks for the role. Scenarios present business contexts, problem constraints, and multiple-choice or structured actions.',
        },
        {
          question: 'Can I retake a WorkSim scenario if I experience technical issues?',
          answer: 'Assessment attempts are tracked per application session. If you experience an unexpected network failure or system interruption, the company hiring manager can issue a new invitation or resend access from their tracking dashboard.',
        },
      ],
    },
    {
      id: 'employers',
      name: 'Employer Verification & Jobs',
      icon: Building2,
      items: [
        {
          question: 'How does company verification work?',
          answer: 'When a new company registers on HireSphere, its status is set to PendingReview. Platform super-administrators inspect business credentials and official contact emails before granting Approved status. Jobs cannot be published until approval is granted.',
        },
        {
          question: 'How long do published job postings remain active?',
          answer: 'Job postings remain active until their specified expiration date (ExpiresAtUtc) or until the hiring team pauses or archives the listing from their vacancy management dashboard.',
        },
      ],
    },
  ];

  // Filter items based on category and search query
  const filteredCategories = categories.map((cat) => {
    const matchesCat = activeCategory === 'all' || activeCategory === cat.id;
    if (!matchesCat) return { ...cat, items: [] };

    const matchingItems = cat.items.filter((item) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return item.question.toLowerCase().includes(q) || item.answer.toLowerCase().includes(q);
    });

    return { ...cat, items: matchingItems };
  }).filter((cat) => cat.items.length > 0);

  return (
    <PageTransition>
      <div className="portal-container" style={{ padding: '48px 24px', maxWidth: '1100px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 44px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '100px', background: 'var(--soft)', color: 'var(--accent)', fontWeight: 600, fontSize: '13px', marginBottom: '14px' }}>
            <HelpCircle size={15} />
            <span>Help Center & FAQ</span>
          </div>
          <h1 style={{ fontSize: 'clamp(32px, 4vw, 46px)', marginBottom: '14px', letterSpacing: '-0.03em' }}>
            Frequently Asked Questions
          </h1>
          <p className="muted" style={{ fontSize: '17px', lineHeight: 1.6 }}>
            Browse answers to common questions about accounts, verification, skills testing, and recruitment tracking.
          </p>

          {/* Search Input */}
          <div style={{ marginTop: '28px', maxWidth: '540px', margin: '28px auto 0', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 18px', background: 'var(--surface)', borderRadius: '100px', border: '1px solid var(--line)', boxShadow: 'var(--sh)' }}>
              <Search size={18} style={{ color: 'var(--muted)' }} />
              <input
                type="search"
                placeholder="Search topics or keywords (e.g. CV privacy, WorkSim, verification)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none', fontSize: '15px' }}
                aria-label="Search FAQ"
              />
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '40px' }}>
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            style={{
              padding: '8px 18px',
              borderRadius: '100px',
              border: '1px solid',
              borderColor: activeCategory === 'all' ? 'var(--accent)' : 'var(--line)',
              background: activeCategory === 'all' ? 'var(--accent)' : 'var(--surface)',
              color: activeCategory === 'all' ? '#fff' : 'var(--ink)',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            All Questions
          </button>
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 18px',
                  borderRadius: '100px',
                  border: '1px solid',
                  borderColor: isSelected ? 'var(--accent)' : 'var(--line)',
                  background: isSelected ? 'var(--accent)' : 'var(--surface)',
                  color: isSelected ? '#fff' : 'var(--ink)',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                <Icon size={14} />
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>

        {/* FAQ Accordion Groups */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', marginBottom: '64px' }}>
          {filteredCategories.length === 0 ? (
            <div className="card" style={{ padding: '48px', textAlign: 'center', background: 'var(--surface)' }}>
              <HelpCircle size={36} style={{ color: 'var(--muted)', margin: '0 auto 12px' }} />
              <h3>No matching questions found</h3>
              <p className="muted" style={{ fontSize: '14px', marginTop: '6px' }}>
                Try adjusting your search query or clear the filter to view all topics.
              </p>
            </div>
          ) : (
            filteredCategories.map((cat, cIdx) => (
              <div key={cat.id} className="card" style={{ padding: '28px', background: 'var(--surface)', borderRadius: 'var(--r)', border: '1px solid var(--line)', boxShadow: 'var(--sh)' }}>
                <h3 style={{ fontSize: '20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <cat.icon size={20} style={{ color: 'var(--accent)' }} />
                  <span>{cat.name}</span>
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {cat.items.map((item, iIdx) => {
                    const itemKey = `cat-${cIdx}-${iIdx}`;
                    const isOpen = !!openItems[itemKey];

                    return (
                      <div
                        key={iIdx}
                        style={{
                          borderRadius: 'var(--r-sm)',
                          border: '1px solid',
                          borderColor: isOpen ? 'var(--accent)' : 'var(--line)',
                          background: isOpen ? 'var(--bg)' : 'var(--surface)',
                          overflow: 'hidden',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => toggleItem(itemKey)}
                          aria-expanded={isOpen}
                          style={{
                            width: '100%',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '16px 18px',
                            background: 'transparent',
                            border: 'none',
                            textAlign: 'left',
                            fontWeight: 600,
                            fontSize: '15px',
                            color: isOpen ? 'var(--accent)' : 'var(--ink)',
                            cursor: 'pointer',
                          }}
                        >
                          <span>{item.question}</span>
                          <motion.span
                            animate={{ rotate: isOpen ? 180 : 0 }}
                            transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
                            style={{ flexShrink: 0, marginLeft: '12px' }}
                          >
                            <ChevronDown size={18} />
                          </motion.span>
                        </button>

                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
                              style={{ overflow: 'hidden' }}
                            >
                              <div style={{ padding: '0 18px 18px 18px', fontSize: '14px', color: 'var(--muted)', lineHeight: 1.6 }}>
                                {item.answer}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Contact Assistance Callout */}
        <div style={{ textAlign: 'center', padding: '36px', background: 'var(--soft)', borderRadius: 'var(--r)', border: '1px solid var(--line)' }}>
          <Mail size={32} style={{ color: 'var(--accent)', margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>Still have questions?</h3>
          <p className="muted" style={{ fontSize: '15px', maxWidth: '480px', margin: '0 auto 20px' }}>
            Our team is here to assist with company verification, technical support, or questions regarding recruitment workflows.
          </p>
          <Link to="/contact" className="btn primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: 'var(--r-sm)', fontWeight: 600 }}>
            <span>Contact Support</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </PageTransition>
  );
};

export default HelpFaq;
