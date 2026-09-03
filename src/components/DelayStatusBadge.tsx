import { memo } from 'react';

import { delayLabel, statusLabel } from '../lib/format';
import type { ArrivalStatus } from '../types/transit';

const TONE: Record<ArrivalStatus, string> = {
  early: 'bg-sky-100 text-sky-800',
  ontime: 'bg-emerald-100 text-emerald-800',
  late: 'bg-rose-100 text-rose-800',
  unknown: 'bg-neutral-100 text-neutral-700',
};

const DOT: Record<ArrivalStatus, string> = {
  early: 'bg-sky-500',
  ontime: 'bg-emerald-500',
  late: 'bg-rose-500',
  unknown: 'bg-neutral-400',
};

interface DelayStatusBadgeProps {
  status: ArrivalStatus;
  delaySeconds: number;
}

export const DelayStatusBadge = memo(function DelayStatusBadge({
  status,
  delaySeconds,
}: DelayStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[0.6875rem] font-bold ${TONE[status]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${DOT[status]}`} aria-hidden="true" />
      <span className="sr-only">{statusLabel(status)}: </span>
      {delayLabel({ status, delaySeconds })}
    </span>
  );
});
