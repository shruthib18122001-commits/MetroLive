import { memo } from 'react';

/** LA Metro rail line colours; bus routes fall through to neutral.
 * Shades are chosen to clear WCAG AA contrast against a white card with 14px bold text. */
function toneFor(routeId: string, routeName: string): string {
  const key = `${routeName} ${routeId}`.toLowerCase();
  if (/\ba line\b|\b801\b/.test(key)) return 'bg-blue-700 text-white';
  if (/\bb line\b|\b802\b/.test(key)) return 'bg-red-700 text-white';
  if (/\bc line\b|\b803\b/.test(key)) return 'bg-emerald-700 text-white';
  if (/\bd line\b|\b804\b/.test(key)) return 'bg-purple-700 text-white';
  if (/\be line\b|\b807\b/.test(key)) return 'bg-yellow-400 text-neutral-900';
  if (/\bk line\b|\b810\b/.test(key)) return 'bg-pink-700 text-white';
  if (/\bg line\b|\bj line\b|\b901\b|\b910\b/.test(key)) return 'bg-orange-700 text-white';
  return 'bg-neutral-800 text-white';
}

interface RouteBadgeProps {
  routeId: string;
  routeName: string;
}

export const RouteBadge = memo(function RouteBadge({ routeId, routeName }: RouteBadgeProps) {
  const label = routeName || routeId || '—';
  return (
    <span
      className={`inline-flex min-w-[2.75rem] items-center justify-center rounded-md px-2 py-1 text-sm font-bold tabular-nums ${toneFor(
        routeId,
        routeName,
      )}`}
    >
      <span className="sr-only">Route </span>
      {label}
    </span>
  );
});
