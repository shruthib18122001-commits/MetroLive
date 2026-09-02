/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        page: '#f6f6f4',
        brand: {
          50: '#f0f7f4',
          100: '#dbeee5',
          200: '#b8ddcb',
          300: '#8bc4a9',
          400: '#57a382',
          500: '#348466',
          600: '#256b52',
          700: '#1a5340',
          800: '#123f30',
          900: '#0b3d2e',
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
        card: '0 1px 2px 0 rgb(16 24 32 / 0.04), 0 1px 3px 0 rgb(16 24 32 / 0.05)',
        'card-hover': '0 6px 20px -4px rgb(16 24 32 / 0.12), 0 2px 6px -2px rgb(16 24 32 / 0.07)',
        header: '0 1px 0 0 rgb(16 24 32 / 0.05)',
        glow: '0 0 0 3px rgb(37 107 82 / 0.12)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        rise: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        pop: {
          '0%': { transform: 'scale(0.5)' },
          '55%': { transform: 'scale(1.18)' },
          '100%': { transform: 'scale(1)' },
        },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        'pulse-soft': { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.55' } },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out both',
        rise: 'rise 0.34s cubic-bezier(0.22, 1, 0.36, 1) both',
        pop: 'pop 0.3s ease-out both',
        shimmer: 'shimmer 1.6s infinite',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
