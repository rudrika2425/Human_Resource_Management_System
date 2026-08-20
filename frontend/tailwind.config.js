/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#edfdf6',
          100: '#d6f8e5',
          200: '#afeecf',
          300: '#7de0b0',
          400: '#49c58a',
          500: '#1ea86a',
          600: '#158456',
          700: '#136847',
          800: '#114f39',
          900: '#0e3f2f',
        },
        surface: '#0b0f0d',
        panel: '#111815',
      },
      boxShadow: {
        soft: '0 18px 60px rgba(0, 0, 0, 0.35)',
      },
      backgroundImage: {
        'hero-grid': 'radial-gradient(circle at 1px 1px, rgba(30,168,106,0.15) 1px, transparent 0)',
      },
    },
  },
  plugins: [],
};
