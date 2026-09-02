import { memo } from 'react';

import { delayLabel, statusLabel } from '../lib/format';
import type { ArrivalStatus } from '../types/transit';

const TONE: Record<ArrivalStatus, { dot: string; text: string }> = {
  early: { dot: 'bg-sky-500', text: 'text-sky-700' },
  ontime: { dot: 'bg-emerald-500', text: 'text-emerald-700' },
  late: { dot: 'bg-rose-500', text: 'text-rose-700' },
  unknown: { dot: 'bg-neutral-400', text: 'text-neutral-600' },
};

interface DelayStatusBadgeProps {
  status: ArrivalStatus;
  delaySeconds: number;
}

export const DelayStatusBadge = memo(function DelayStatusBadge({
  status,
  delaySeconds,
}: DelayStatusBadgeProps) {
  const tone = TONE[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${tone.text}`}>
      <span className={`h-2 w-2 rounded-full ${tone.dot}`} aria-hidden="true" />
      <span className="sr-only">{statusLabel(status)}: </span>
      {delayLabel({ status, delaySeconds })}
    </span>
  );
});
