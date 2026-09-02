import type { ReactNode } from 'react';

interface StateMessageProps {
  title: string;
  description?: string;
  tone?: 'info' | 'error';
  icon?: ReactNode;
  action?: ReactNode;
}

function DefaultIcon({ tone }: { tone: 'info' | 'error' }) {
  if (tone === 'error') {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

/** The shared shell for every explicit loading / error / empty state. */
export function StateMessage({ title, description, tone = 'info', icon, action }: StateMessageProps) {
  const isError = tone === 'error';
  return (
    <div
      role={isError ? 'alert' : 'status'}
      className={`animate-fade-in flex flex-col items-center gap-3 rounded-2xl border px-6 py-12 text-center shadow-card ${
        isError ? 'border-rose-200 bg-rose-50/70' : 'border-neutral-200/80 bg-white'
      }`}
    >
      <span
        className={`grid h-11 w-11 place-items-center rounded-full ${
          isError ? 'bg-rose-100 text-rose-600' : 'bg-brand-50 text-brand-600'
        }`}
      >
        {icon ?? <DefaultIcon tone={tone} />}
      </span>
      <div className="space-y-1">
        <p className={`text-[0.9375rem] font-semibold ${isError ? 'text-rose-900' : 'text-neutral-900'}`}>
          {title}
        </p>
        {description ? (
          <p
            className={`mx-auto max-w-[17rem] text-[0.8125rem] leading-relaxed ${
              isError ? 'text-rose-700' : 'text-neutral-600'
            }`}
          >
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="pt-1">{action}</div> : null}
    </div>
  );
}
