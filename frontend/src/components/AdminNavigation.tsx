import React from 'react';
import { NavLink } from 'react-router-dom';
import { Layers, Building2, Users, Briefcase, ShieldCheck } from 'lucide-react';

interface AdminNavigationProps {
  pendingCompanyCount?: number;
}

export const AdminNavigation: React.FC<AdminNavigationProps> = ({ pendingCompanyCount }) => {
  return (
    <nav className="admin-tabs" aria-label="Admin navigation">
      <NavLink
        to="/admin/dashboard"
        className={({ isActive }) => (isActive ? 'active' : '')}
      >
        <Layers size={17} />
        <span>Platform overview</span>
      </NavLink>

      <NavLink
        to="/admin/companies"
        className={({ isActive }) => (isActive ? 'active' : '')}
      >
        <Building2 size={17} />
        <span>Company verification</span>
        {pendingCompanyCount !== undefined && pendingCompanyCount > 0 ? (
          <span className="badge b-warn nodot">{pendingCompanyCount}</span>
        ) : null}
      </NavLink>

      <NavLink
        to="/admin/users"
        className={({ isActive }) => (isActive ? 'active' : '')}
      >
        <Users size={17} />
        <span>User accounts</span>
      </NavLink>

      <NavLink
        to="/admin/jobs"
        className={({ isActive }) => (isActive ? 'active' : '')}
      >
        <Briefcase size={17} />
        <span>Job moderation</span>
      </NavLink>

      <NavLink
        to="/admin/audit"
        className={({ isActive }) => (isActive ? 'active' : '')}
      >
        <ShieldCheck size={17} />
        <span>Audit trail</span>
      </NavLink>
    </nav>
  );
};
