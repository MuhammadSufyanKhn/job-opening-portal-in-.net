import React from 'react';
import { 
  ShieldCheck, 
  UserCheck, 
  FileLock2, 
  Scale, 
  Eye
} from 'lucide-react';

export const TrustPrinciplesSection: React.FC = () => {
  const principles = [
    {
      title: 'A real person decides',
      description: 'HireSphere never makes automated rejection or hiring decisions. All candidate transitions and offers are decided by a real hiring person.',
      icon: UserCheck
    },
    {
      title: 'See how well you fit a job',
      description: 'Our matching helps you understand how well your skills match requirements before applying. Real people make the decisions.',
      icon: Eye
    },
    {
      title: 'Your CV stays private',
      description: 'Uploaded CVs and resumes are stored securely. Only the companies you apply to can see them. They are never crawled or shared.',
      icon: FileLock2
    },
    {
      title: "Your company's information is private to your team",
      description: 'Company vacancies, private applicant reviews, recruiter notes, and interview details are protected and private to your team.',
      icon: ShieldCheck
    }
  ];

  return (
    <section className="home-section bg-surface-subtle" id="trust" aria-labelledby="trust-heading">
      <div className="home-container">
        <div className="section-header-center">
          <div className="section-eyebrow">
            <Scale size={14} className="text-primary" />
            <span>Ethical Foundation</span>
          </div>
          <h2 id="trust-heading" className="section-title">
            Responsible, Transparent Hiring Technology
          </h2>
          <p className="section-subtitle">
            We believe recruitment software should foster trust between jobseekers and hiring teams through 
            data integrity, transparent criteria, and genuine human accountability.
          </p>
        </div>

        <div className="trust-cards-grid">
          {principles.map((p, idx) => {
            const Icon = p.icon;
            return (
              <div key={idx} className="trust-principle-card">
                <div className="trust-card-icon-wrap">
                  <Icon size={22} className="text-primary" aria-hidden="true" />
                </div>
                <h3 className="trust-card-title">{p.title}</h3>
                <p className="trust-card-description">{p.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
