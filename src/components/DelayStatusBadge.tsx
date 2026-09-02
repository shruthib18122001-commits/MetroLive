import { memo } from 'react';

import { delayLabel, statusLabel } from '../lib/format';
import type { ArrivalStatus } from '../types/transit';

const TONE: Record<ArrivalStatus, string> = {
  early: 'bg-sky-50 text-sky-700',
  ontime: 'bg-emerald-50 text-emerald-700',
  late: 'bg-rose-50 text-rose-700',
  unknown: 'bg-neutral-100 text-neutral-600',
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
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[0.6875rem] font-semibold ${TONE[status]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${DOT[status]}`} aria-hidden="true" />
      <span className="sr-only">{statusLabel(status)}: </span>
      {delayLabel({ status, delaySeconds })}
    </span>
  );
});
