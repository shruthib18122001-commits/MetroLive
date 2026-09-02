import type { ReactNode } from 'react';

interface StateMessageProps {
  title: string;
  description?: string;
  tone?: 'info' | 'error';
  icon?: ReactNode;
  action?: ReactNode;
}

/** The shared shell for every explicit loading / error / empty state. */
export function StateMessage({ title, description, tone = 'info', icon, action }: StateMessageProps) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`flex flex-col items-center gap-2 rounded-xl border px-4 py-8 text-center ${
        tone === 'error'
          ? 'border-rose-200 bg-rose-50 text-rose-900'
          : 'border-neutral-200 bg-white text-neutral-700'
      }`}
    >
      {icon ? <div className="text-neutral-400">{icon}</div> : null}
      <p className="text-base font-semibold">{title}</p>
      {description ? <p className="max-w-xs text-sm text-neutral-600">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
