/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Bordeaux — the wine, not the city.
        brand: {
          50: '#fdf3f4',
          100: '#fbe4e7',
          200: '#f6ccd3',
          300: '#eda3b0',
          400: '#e07189',
          500: '#cf4463',
          600: '#b32b4c',
          700: '#961f3f',
          800: '#7d1c39',
          900: '#5c1128',
        },
        // Warm greys, so cream and paper rather than cold slate.
        ink: {
          50: '#faf8f5',
          100: '#e8e4de',
          400: '#918a80',
          600: '#544e46',
          800: '#2c2823',
          900: '#1a1714',
        },
        // For accents that shouldn't be red: the gold on a bistro sign.
        gilt: {
          50: '#fdf9ed',
          400: '#d4a24c',
          600: '#a97b2c',
        },
      },
      boxShadow: {
        card: '0 1px 3px rgb(0 0 0 / 0.04), 0 8px 24px -12px rgb(0 0 0 / 0.12)',
        lift: '0 4px 12px rgb(0 0 0 / 0.06), 0 24px 48px -20px rgb(0 0 0 / 0.25)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.45s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [],
};
