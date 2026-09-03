/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        page: '#f5f6fb',
        // Primary accent — soft indigo.
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
      },
      fontFamily: {
        sans: [
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(30 27 75 / 0.05), 0 8px 24px -8px rgb(30 27 75 / 0.14)',
        'card-hover': '0 14px 36px -10px rgb(30 27 75 / 0.24), 0 4px 10px -4px rgb(30 27 75 / 0.12)',
        glow: '0 0 0 4px rgb(99 102 241 / 0.14)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        rise: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        pop: {
          '0%': { transform: 'scale(0.5)' },
          '55%': { transform: 'scale(1.18)' },
          '100%': { transform: 'scale(1)' },
        },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        'pulse-soft': { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.5' } },
        drift: {
          '0%': { transform: 'translate3d(0, 0, 0) scale(1)' },
          '100%': { transform: 'translate3d(24px, -36px, 0) scale(1.12)' },
        },
        dash: { to: { 'stroke-dashoffset': '-260' } },
        'station-pulse': {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.9' },
          '50%': { transform: 'scale(1.5)', opacity: '0.35' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.25s ease-out both',
        rise: 'rise 0.4s cubic-bezier(0.22, 1, 0.36, 1) both',
        pop: 'pop 0.3s ease-out both',
        shimmer: 'shimmer 1.6s infinite',
        'pulse-soft': 'pulse-soft 1.8s ease-in-out infinite',
        drift: 'drift 26s ease-in-out infinite alternate',
        dash: 'dash 18s linear infinite',
        'station-pulse': 'station-pulse 3.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
