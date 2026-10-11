import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Building2, Users, Briefcase, ShieldCheck } from 'lucide-react';

export const AdminNavigation: React.FC = () => {
  return (
    <nav className="admin-nav-tabs" aria-label="Admin Navigation">
      <NavLink
        to="/admin/dashboard"
        className={({ isActive }) => `admin-tab-link ${isActive ? 'active' : ''}`}
      >
        <LayoutDashboard size={18} />
        <span>Platform Overview</span>
      </NavLink>

      <NavLink
        to="/admin/companies"
        className={({ isActive }) => `admin-tab-link ${isActive ? 'active' : ''}`}
      >
        <Building2 size={18} />
        <span>Company Verification</span>
      </NavLink>

      <NavLink
        to="/admin/users"
        className={({ isActive }) => `admin-tab-link ${isActive ? 'active' : ''}`}
      >
        <Users size={18} />
        <span>User Accounts</span>
      </NavLink>

      <NavLink
        to="/admin/jobs"
        className={({ isActive }) => `admin-tab-link ${isActive ? 'active' : ''}`}
      >
        <Briefcase size={18} />
        <span>Job Moderation</span>
      </NavLink>

      <NavLink
        to="/admin/audit"
        className={({ isActive }) => `admin-tab-link ${isActive ? 'active' : ''}`}
      >
        <ShieldCheck size={18} />
        <span>Audit Trail</span>
      </NavLink>
    </nav>
  );
};
