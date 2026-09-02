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
        'card-hover': '0 4px 12px -2px rgb(16 24 32 / 0.10), 0 2px 4px -1px rgb(16 24 32 / 0.06)',
        header: '0 1px 0 0 rgb(16 24 32 / 0.05)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.18s ease-out both',
      },
    },
  },
  plugins: [],
};
