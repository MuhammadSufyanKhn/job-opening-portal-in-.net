import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className = ''
}) => {
  return (
    <div className={`empty-state ${className}`.trim()}>
      <div className="empty-state-icon" aria-hidden="true">
        <Icon size={26} />
      </div>
      <h3 className="empty-state-title">
        {title}
      </h3>
      {description && (
        <p className="empty-state-description">
          {description}
        </p>
      )}
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="btn btn-primary"
        >
          {action.icon && <action.icon size={16} />}
          {action.label}
        </button>
      )}
    </div>
  );
};
