import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
  category: 'Candidate' | 'Employer' | 'General';
}

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [filterCategory, setFilterCategory] = useState<string>('All');

  const faqs: FaqItem[] = [
    {
      category: 'General',
      question: 'What is WorkSim and how does it work?',
      answer: 'WorkSim is HireSphere\'s proprietary job-simulation capability. Instead of generic multiple-choice quizzes or live whiteboard grilling, candidates are placed in realistic, role-relevant work scenarios (e.g. incident mitigation, code review triage, system design trade-offs). Candidates analyze unlocked evidence files, take decisions, and explain their rationale. Responses are evaluated against deterministic operational rubrics.'
    },
    {
      category: 'Candidate',
      question: 'Are my uploaded CVs public or searchable by other companies?',
      answer: 'No. Your CVs are stored in a private, encrypted file vault. A company can only access your CV when you explicitly submit an application to one of their vacancies. Your profile and documents are never exposed to the public internet or searchable by unauthorized third parties.'
    },
    {
      category: 'Candidate',
      question: 'Does HireSphere use AI to automatically reject candidates?',
      answer: 'No. HireSphere provides an explainable evidence match report to help candidates and recruiters understand how declared qualifications align with job specifications. All application status decisions—including screening, interview scheduling, and final offers—are made solely by human recruitment teams.'
    },
    {
      category: 'Employer',
      question: 'How do employers verify their company profile?',
      answer: 'When an organization registers on HireSphere, the registration is reviewed by platform administrators before company members can publish live vacancies on the public marketplace. This prevents scam postings and ensures all job listings come from verified legal organizations.'
    },
    {
      category: 'Employer',
      question: 'Can hiring team members collaborate on candidate evaluations?',
      answer: 'Yes. Company workspaces support team collaboration. Recruiters and hiring managers can invite teammates, review applications across a shared Kanban pipeline, coordinate interview times, and add private recruiter notes that remain strictly confidential to your organization.'
    },
    {
      category: 'Candidate',
      question: 'Is HireSphere free for jobseekers and candidates?',
      answer: 'Yes. Job discovery, profile creation, CV vault storage, job applications, application tracking, and completing assigned WorkSim simulations are completely free for all candidates.'
    },
    {
      category: 'General',
      question: 'What document formats are supported for CV uploads?',
      answer: 'HireSphere currently supports PDF (.pdf) and Microsoft Word (.docx) files up to 10 MB in size. Every uploaded file undergoes file-signature magic byte validation and security checks before text extraction and structured skill analysis.'
    }
  ];

  const filteredFaqs = filterCategory === 'All' 
    ? faqs 
    : faqs.filter(f => f.category === filterCategory);

  const toggleFaq = (index: number) => {
    setOpenIndex(prev => (prev === index ? null : index));
  };

  return (
    <section className="home-section" id="faq" aria-labelledby="faq-heading">
      <div className="home-container">
        <div className="section-header-center">
          <div className="section-eyebrow">
            <HelpCircle size={14} className="text-primary" />
            <span>Got Questions?</span>
          </div>
          <h2 id="faq-heading" className="section-title">
            Frequently Asked Questions
          </h2>
          <p className="section-subtitle">
            Everything you need to know about HireSphere's candidate portal, employer workspace, and WorkSim simulations.
          </p>

          <div className="faq-filter-pills" role="tablist" aria-label="FAQ Categories">
            {['All', 'Candidate', 'Employer', 'General'].map((cat) => (
              <button
                key={cat}
                role="tab"
                aria-selected={filterCategory === cat}
                onClick={() => { setFilterCategory(cat); setOpenIndex(null); }}
                className={`faq-pill ${filterCategory === cat ? 'active' : ''}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="faq-accordion-list" role="region" aria-label="Frequently Asked Questions list">
          {filteredFaqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={index} className={`faq-accordion-item ${isOpen ? 'open' : ''}`}>
                <button
                  type="button"
                  className="faq-question-btn"
                  onClick={() => toggleFaq(index)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${index}`}
                >
                  <span className="question-text">{faq.question}</span>
                  <ChevronDown size={18} className="chevron-icon" aria-hidden="true" />
                </button>
                {isOpen && (
                  <div
                    id={`faq-answer-${index}`}
                    className="faq-answer-panel"
                    role="region"
                  >
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
