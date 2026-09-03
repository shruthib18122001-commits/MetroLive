/**
 * Decorative, screen-filling backdrop: a few drifting colour blobs plus an
 * abstract "transit network" of flowing dashed lines and pulsing stations.
 * Purely ornamental — `aria-hidden`, very low opacity.
 */
interface Line {
  d: string;
  stroke: string;
  duration: string;
  reverse?: boolean;
}

const LINES: readonly Line[] = [
  { d: 'M-40 210 C 260 90, 520 330, 820 180 S 1280 120, 1520 300', stroke: '#6366f1', duration: '19s' },
  { d: 'M-40 470 C 300 470, 460 250, 780 320 S 1200 520, 1520 430', stroke: '#38bdf8', duration: '24s', reverse: true },
  { d: 'M-40 690 C 220 640, 480 780, 760 660 S 1220 560, 1520 700', stroke: '#2dd4bf', duration: '21s' },
  { d: 'M120 -40 C 200 260, 60 520, 240 780 S 420 1000, 360 1180', stroke: '#f472b6', duration: '27s', reverse: true },
  { d: 'M1180 -40 C 1120 220, 1320 460, 1180 720 S 1040 980, 1220 1180', stroke: '#fbbf24', duration: '23s' },
];

const STATIONS: readonly { cx: number; cy: number; fill: string; delay: string }[] = [
  { cx: 260, cy: 118, fill: '#6366f1', delay: '0s' },
  { cx: 820, cy: 180, fill: '#818cf8', delay: '0.6s' },
  { cx: 780, cy: 320, fill: '#38bdf8', delay: '1.1s' },
  { cx: 760, cy: 660, fill: '#2dd4bf', delay: '1.7s' },
  { cx: 240, cy: 780, fill: '#f472b6', delay: '2.3s' },
  { cx: 1180, cy: 720, fill: '#fbbf24', delay: '0.9s' },
];

export function TransitBackdrop() {
  return (
    <div className="app-bg fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <span
        className="absolute -left-32 -top-32 h-[30rem] w-[30rem] rounded-full bg-brand-300/25 blur-3xl animate-drift"
        style={{ animationDuration: '30s' }}
      />
      <span
        className="absolute -right-40 bottom-[-8rem] h-[26rem] w-[26rem] rounded-full bg-teal-300/20 blur-3xl animate-drift"
        style={{ animationDuration: '38s', animationDelay: '-14s' }}
      />

      <svg
        className="absolute inset-0 h-full w-full opacity-[0.18]"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        {LINES.map((line, i) => (
          <path
            key={i}
            d={line.d}
            stroke={line.stroke}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeDasharray="6 16"
            className="animate-dash"
            style={{
              animationDuration: line.duration,
              animationDirection: line.reverse ? 'reverse' : 'normal',
            }}
          />
        ))}
        {STATIONS.map((s, i) => (
          <circle
            key={i}
            cx={s.cx}
            cy={s.cy}
            r={5}
            fill={s.fill}
            className="origin-center animate-station-pulse"
            style={{ animationDelay: s.delay }}
          />
        ))}
      </svg>
    </div>
  );
}
