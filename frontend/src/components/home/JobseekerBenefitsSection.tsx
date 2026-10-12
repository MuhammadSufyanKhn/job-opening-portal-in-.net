import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Sparkles, 
  Clock, 
  Award, 
  Lock, 
  UserCheck,
  ArrowRight
} from 'lucide-react';
import { JOBSEEKER_BENEFITS } from '../../content/homeContent';

export const JobseekerBenefitsSection: React.FC = () => {
  const getBenefitIcon = (iconName: string) => {
    switch (iconName) {
      case 'shield': return <ShieldCheck size={20} />;
      case 'spark': return <Sparkles size={20} />;
      case 'clock': return <Clock size={20} />;
      case 'award': return <Award size={20} />;
      case 'lock': return <Lock size={20} />;
      case 'usercheck': return <UserCheck size={20} />;
      default: return <ShieldCheck size={20} />;
    }
  };

  return (
    <section className="s white" id="why" aria-labelledby="why-heading">
      <div className="container">
        <div className="head">
          <div>
            <h2 id="why-heading">Why jobseekers choose HireSphere</h2>
            <p>A job search should feel fair and clear. Here is how we make that happen.</p>
          </div>
          <Link to="/register-candidate" className="btn primary">
            <span>Create your free profile</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="pros">
          {JOBSEEKER_BENEFITS.map((b, idx) => (
            <div key={idx} className="card pro">
              <span className="fi">
                {getBenefitIcon(b.iconName)}
              </span>
              <h3>{b.title}</h3>
              <p>{b.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
