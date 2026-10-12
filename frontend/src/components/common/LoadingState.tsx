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
      <div className="spinner" aria-hidden="true" />
      <p className="loading-message">
        {message}
      </p>
    </div>
  );
};
