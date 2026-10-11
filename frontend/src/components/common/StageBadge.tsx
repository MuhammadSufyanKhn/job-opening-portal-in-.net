import React from 'react';
import type { ApplicationStage } from '../../types/recruitment';

interface StageBadgeProps {
  stage: ApplicationStage | string | number;
  className?: string;
  style?: React.CSSProperties;
}

const STAGE_CONFIG: Record<string, { label: string; className: string }> = {
  '0': { label: 'Submitted', className: 'badge-outline' },
  '1': { label: 'Under Review', className: 'badge-purple' },
  '2': { label: 'Shortlisted', className: 'badge-cyan' },
  '3': { label: 'Assessment Pending', className: 'badge-amber' },
  '4': { label: 'Assessment Completed', className: 'badge-cyan' },
  '5': { label: 'Interview Scheduled', className: 'badge-purple' },
  '6': { label: 'Offer Extended', className: 'badge-emerald' },
  '7': { label: 'Hired', className: 'badge-emerald' },
  '8': { label: 'Rejected', className: 'badge-danger' },
  '9': { label: 'Withdrawn', className: 'badge-muted' },
  'Submitted': { label: 'Submitted', className: 'badge-outline' },
  'UnderReview': { label: 'Under Review', className: 'badge-purple' },
  'Shortlisted': { label: 'Shortlisted', className: 'badge-cyan' },
  'AssessmentPending': { label: 'Assessment Pending', className: 'badge-amber' },
  'AssessmentCompleted': { label: 'Assessment Completed', className: 'badge-cyan' },
  'InterviewScheduled': { label: 'Interview Scheduled', className: 'badge-purple' },
  'Offered': { label: 'Offer Extended', className: 'badge-emerald' },
  'Hired': { label: 'Hired', className: 'badge-emerald' },
  'Rejected': { label: 'Rejected', className: 'badge-danger' },
  'Withdrawn': { label: 'Withdrawn', className: 'badge-muted' },
};

export const StageBadge: React.FC<StageBadgeProps> = ({
  stage,
  className = '',
  style
}) => {
  const stageKey = String(stage);
  const config = STAGE_CONFIG[stageKey] || { label: stageKey, className: 'badge-outline' };

  return (
    <span 
      className={`badge ${config.className} ${className}`.trim()} 
      style={{ fontSize: '0.75rem', fontWeight: 600, ...style }}
    >
      {config.label}
    </span>
  );
};
