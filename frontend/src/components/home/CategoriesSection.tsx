import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Code, 
  PenTool, 
  TrendingUp, 
  Briefcase, 
  BarChart3, 
  MessageSquare, 
  Layers, 
  UserCheck,
  ArrowRight
} from 'lucide-react';
import { HOME_CATEGORIES } from '../../content/homeContent';

export const CategoriesSection: React.FC = () => {
  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'code': return <Code size={20} />;
      case 'pen': return <PenTool size={20} />;
      case 'trend': return <TrendingUp size={20} />;
      case 'briefcase': return <Briefcase size={20} />;
      case 'chart': return <BarChart3 size={20} />;
      case 'msg': return <MessageSquare size={20} />;
      case 'layers': return <Layers size={20} />;
      case 'usercheck': return <UserCheck size={20} />;
      default: return <Briefcase size={20} />;
    }
  };

  return (
    <section className="s" id="categories" aria-labelledby="cat-heading">
      <div className="container">
        <div className="head">
          <div>
            <h2 id="cat-heading">Browse jobs by category</h2>
            <p>Whatever you do, there's a good chance someone is hiring for it today.</p>
          </div>
          <Link to="/jobs" className="btn">
            <span>See all jobs</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="cats">
          {HOME_CATEGORIES.map((cat) => (
            <Link 
              key={cat.id} 
              to={`/jobs?search=${encodeURIComponent(cat.name)}`}
              className="card cat"
            >
              <span className="fi">
                {getCategoryIcon(cat.iconName)}
              </span>
              <span>
                <b>{cat.name}</b>
                <small>{cat.count} open jobs</small>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
