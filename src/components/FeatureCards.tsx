interface Feature {
  title: string;
  body: string;
  tint: string;
  icon: JSX.Element;
}

const FEATURES: readonly Feature[] = [
  {
    title: 'Live predictions',
    body: 'Straight from LA Metro’s GTFS-realtime feed, refreshed every 30 seconds.',
    tint: 'bg-sky-100 text-sky-600',
    icon: (
      <path d="M13 2 4.5 12.5H11l-1 7.5 8.5-10.5H12l1-7.5Z" />
    ),
  },
  {
    title: 'Every stop',
    body: 'All 12,000+ Metro bus stops and rail stations, searchable by name.',
    tint: 'bg-violet-100 text-violet-600',
    icon: (
      <path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7Zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z" />
    ),
  },
  {
    title: 'Save your regulars',
    body: 'Pin the stops you use — they’re there next time, no account needed.',
    tint: 'bg-amber-100 text-amber-600',
    icon: (
      <path d="m12 3 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.8 6.2 20.9l1.1-6.5L2.6 9.8l6.5-.9L12 3Z" />
    ),
  },
];

export function FeatureCards() {
  return (
    <ul className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-3">
      {FEATURES.map((feature, index) => (
        <li
          key={feature.title}
          className="glass animate-rise rounded-2xl p-5 shadow-card"
          style={{ animationDelay: `${120 + index * 70}ms` }}
        >
          <span className={`grid h-10 w-10 place-items-center rounded-xl ${feature.tint}`}>
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
              {feature.icon}
            </svg>
          </span>
          <h3 className="mt-3 text-sm font-bold text-neutral-900">{feature.title}</h3>
          <p className="mt-1 text-[0.8125rem] leading-relaxed text-neutral-600">{feature.body}</p>
        </li>
      ))}
    </ul>
  );
}
