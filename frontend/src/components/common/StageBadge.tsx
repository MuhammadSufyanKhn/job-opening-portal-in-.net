import React from 'react';
import type { ApplicationStage } from '../../types/recruitment';

interface StageBadgeProps {
  stage: ApplicationStage | string | number;
  className?: string;
  style?: React.CSSProperties;
}

const STAGE_CONFIG: Record<string, { label: string; className: string }> = {
  '0': { label: 'Submitted', className: 'badge-outline' },
  '1': { label: 'Under review', className: 'badge-purple b-pur' },
  '2': { label: 'Shortlisted', className: 'badge-cyan b-cy' },
  '3': { label: 'Skills challenge to do', className: 'badge-amber b-warn' },
  '4': { label: 'Skills challenge done', className: 'badge-cyan b-cy' },
  '5': { label: 'Interview scheduled', className: 'badge-purple b-pur' },
  '6': { label: 'Offer extended', className: 'badge-emerald b-ok' },
  '7': { label: 'Hired', className: 'badge-emerald b-ok' },
  '8': { label: 'Rejected', className: 'badge-danger b-bad' },
  '9': { label: 'Withdrawn', className: 'badge-muted' },
  'Submitted': { label: 'Submitted', className: 'badge-outline' },
  'UnderReview': { label: 'Under review', className: 'badge-purple b-pur' },
  'Shortlisted': { label: 'Shortlisted', className: 'badge-cyan b-cy' },
  'AssessmentPending': { label: 'Skills challenge to do', className: 'badge-amber b-warn' },
  'AssessmentCompleted': { label: 'Skills challenge done', className: 'badge-cyan b-cy' },
  'InterviewScheduled': { label: 'Interview scheduled', className: 'badge-purple b-pur' },
  'Offered': { label: 'Offer extended', className: 'badge-emerald b-ok' },
  'Hired': { label: 'Hired', className: 'badge-emerald b-ok' },
  'Rejected': { label: 'Rejected', className: 'badge-danger b-bad' },
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
      style={style}
    >
      {config.label}
    </span>
  );
};
