import { useId } from 'react';

interface StopSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  busy?: boolean;
}

export function StopSearchInput({ value, onChange, busy = false }: StopSearchInputProps) {
  const inputId = useId();
  const hintId = useId();

  return (
    <div>
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-semibold text-neutral-800">
        Stop name
      </label>

      <div className="relative">
        <span
          className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-brand-500"
          aria-hidden="true"
        >
          <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="9" cy="9" r="6" />
            <path d="m17 17-3.5-3.5" />
          </svg>
        </span>

        <input
          id={inputId}
          type="search"
          inputMode="search"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="search"
          aria-describedby={hintId}
          placeholder="7th Street / Metro Center"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-14 w-full rounded-2xl border border-neutral-200 bg-white pl-12 pr-12 text-base text-neutral-900 shadow-card outline-none transition placeholder:text-neutral-400 focus:border-brand-400 focus:shadow-glow"
        />

        {value ? (
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="Clear search"
            className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-2xl text-neutral-500 transition-colors hover:text-neutral-800"
          >
            <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden="true" fill="currentColor">
              <path d="M10 8.94l3.72-3.72a.75.75 0 1 1 1.06 1.06L11.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06L10 11.06l-3.72 3.72a.75.75 0 0 1-1.06-1.06L8.94 10 5.22 6.28a.75.75 0 0 1 1.06-1.06L10 8.94Z" />
            </svg>
          </button>
        ) : null}
      </div>

      <p id={hintId} className="mt-2 flex items-center gap-1.5 text-xs text-neutral-600">
        {busy ? (
          <>
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-pulse-soft" aria-hidden="true" />
            Searching…
          </>
        ) : (
          'Type at least two letters to search LA Metro stops.'
        )}
      </p>
    </div>
  );
}
