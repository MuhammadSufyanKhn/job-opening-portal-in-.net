import React from 'react';

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading data...',
  className = ''
}) => {
  return (
    <div 
      className={`loading-state ${className}`.trim()} 
      role="status" 
      aria-live="polite"
    >
      <div className="spinner" aria-hidden="true" style={{ width: '2rem', height: '2rem' }} />
      <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
        {message}
      </p>
    </div>
  );
};
