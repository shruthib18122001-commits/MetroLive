/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        page: '#f4f5f2',
        brand: {
          50: '#eef7f2',
          100: '#d3ecdf',
          200: '#a6d9bf',
          300: '#71bf9b',
          400: '#3fa078',
          500: '#1f8560',
          600: '#136c4c',
          700: '#0f553d',
          800: '#0d4331',
          900: '#0a3527',
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
        card: '0 1px 2px 0 rgb(10 53 39 / 0.06), 0 6px 16px -6px rgb(10 53 39 / 0.14)',
        'card-hover': '0 10px 28px -8px rgb(10 53 39 / 0.22), 0 3px 8px -3px rgb(10 53 39 / 0.12)',
        hero: '0 14px 40px -12px rgb(10 53 39 / 0.45)',
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
        'pulse-soft': { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.5' } },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out both',
        rise: 'rise 0.34s cubic-bezier(0.22, 1, 0.36, 1) both',
        pop: 'pop 0.3s ease-out both',
        shimmer: 'shimmer 1.6s infinite',
        'pulse-soft': 'pulse-soft 1.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
