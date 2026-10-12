import React from 'react';
import { Link } from 'react-router-dom';
import { Briefcase } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="f" role="contentinfo">
      <div className="container">
        <div className="fg">
          {/* Brand Column */}
          <div>
            <Link to="/" className="brand">
              <i aria-hidden="true">
                <Briefcase size={16} />
              </i>
              <span>HireSphere</span>
            </Link>
            <p>The friendly place to find your next job or your next hire. Free to use.</p>
          </div>

          {/* Column 2: Jobseekers */}
          <div>
            <h4>For jobseekers</h4>
            <ul>
              <li><Link to="/jobs">Browse jobs</Link></li>
              <li><Link to="/register-candidate">Create a free profile</Link></li>
              <li><Link to="/login">Sign in</Link></li>
              <li><a href="/#market">Salary guide</a></li>
            </ul>
          </div>

          {/* Column 3: Employers */}
          <div>
            <h4>For employers</h4>
            <ul>
              <li><Link to="/register-company">Post a job</Link></li>
              <li><Link to="/register-company">Create a company account</Link></li>
              <li><Link to="/login">Sign in</Link></li>
              <li><a href="/#employers">Hiring tips</a></li>
            </ul>
          </div>

          {/* Column 4: Help */}
          <div>
            <h4>Help</h4>
            <ul>
              <li><a href="/#faq">Questions and answers</a></li>
              <li><a href="/#faq">Contact us</a></li>
              <li><a href="#">Privacy</a></li>
              <li><a href="#">Terms</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="fb">
          <span>© {new Date().getFullYear()} HireSphere. All rights reserved.</span>
          <span>Verified companies · Private CVs · Real people make the decisions</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
