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
      <label htmlFor={inputId} className="block text-sm font-semibold text-neutral-800">
        Stop name
      </label>
      <div className="relative mt-1">
        <input
          id={inputId}
          type="search"
          inputMode="search"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="search"
          aria-describedby={hintId}
          placeholder="e.g. 7th Street / Metro Center"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="tap-target w-full rounded-lg border border-neutral-300 bg-white px-3 pr-10 text-base text-neutral-900 placeholder:text-neutral-400 focus-visible:border-brand-600 focus-visible:ring-2 focus-visible:ring-brand-600"
        />
        {value ? (
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="Clear search"
            className="tap-target absolute inset-y-0 right-0 flex items-center justify-center px-3 text-neutral-500 hover:text-neutral-800"
          >
            <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden="true" fill="currentColor">
              <path d="M6.28 6.28a.75.75 0 0 1 1.06 0L10 8.94l2.66-2.66a.75.75 0 1 1 1.06 1.06L11.06 10l2.66 2.66a.75.75 0 1 1-1.06 1.06L10 11.06l-2.66 2.66a.75.75 0 0 1-1.06-1.06L8.94 10 6.28 7.34a.75.75 0 0 1 0-1.06Z" />
            </svg>
          </button>
        ) : null}
      </div>
      <p id={hintId} className="mt-1 text-xs text-neutral-500">
        {busy ? 'Searching…' : 'Type at least two letters to search LA Metro stops.'}
      </p>
    </div>
  );
}
