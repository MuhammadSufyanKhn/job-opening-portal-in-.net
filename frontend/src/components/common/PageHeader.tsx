import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  icon,
  actions,
  className = ''
}) => {
  return (
    <header className={`portal-header ${className}`.trim()}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
          {icon && <div style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center' }}>{icon}</div>}
          <h1 className="portal-title" style={{ margin: 0 }}>{title}</h1>
        </div>
        {subtitle && <p className="portal-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="portal-actions">{actions}</div>}
    </header>
  );
};
