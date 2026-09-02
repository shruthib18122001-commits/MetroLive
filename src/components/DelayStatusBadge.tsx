import { memo } from 'react';

import { delayLabel, statusLabel } from '../lib/format';
import type { ArrivalStatus } from '../types/transit';

const TONE: Record<ArrivalStatus, string> = {
  early: 'bg-sky-50 text-sky-700',
  ontime: 'bg-emerald-50 text-emerald-700',
  late: 'bg-rose-50 text-rose-700',
  unknown: 'bg-neutral-100 text-neutral-600',
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
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.6875rem] font-semibold ${TONE[status]}`}
    >
      <span className="sr-only">{statusLabel(status)}: </span>
      {delayLabel({ status, delaySeconds })}
    </span>
  );
});
