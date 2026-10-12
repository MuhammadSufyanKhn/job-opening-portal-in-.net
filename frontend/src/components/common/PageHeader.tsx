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
    <header className={`ph ${className}`.trim()}>
      <div>
        <div className="ph-title-wrap">
          {icon && <div className="ph-icon">{icon}</div>}
          <h1 className="ph-title">{title}</h1>
        </div>
        {subtitle && <p className="ph-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="ph-actions row">{actions}</div>}
    </header>
  );
};
