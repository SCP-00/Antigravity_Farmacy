import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta principal Farmacy
        teal: {
          50:  '#EEF5FF',
          100: '#D9E8FF',
          200: '#B8D4FF',
          300: '#8CB7FF',
          400: '#6099FF',
          500: '#367BFF',
          600: '#1C66EF',
          700: '#1352C7',  // Color primario
          800: '#123B8A',
          900: '#0E245E',  // Navy
        },
        amber: { DEFAULT: '#BA7517' },
        danger: { DEFAULT: '#A32D2D', light: '#FCEBEB' },
        red: {
          50: '#FDF2F4',
          100: '#FCE7EB',
          200: '#F9C9D1',
          300: '#F39FB0',
          400: '#E96B87',
          500: '#D92E55',
          600: '#B91C45',
          700: '#9F173B',
          800: '#7F1330',
          900: '#5E0E23',
        },
      },
      fontFamily: {
        sans:  ['DM Sans', 'system-ui', 'sans-serif'],
        serif: ['DM Serif Display', 'serif'],
      },
      borderRadius: {
        pill: '9999px',
        xl:   '1rem',
        '2xl':'1.25rem',
        '3xl':'1.5rem',
      },
      boxShadow: {
        soft: '0 1px 4px rgba(15,110,86,0.08)',
        md:   '0 4px 16px rgba(15,110,86,0.12)',
        lg:   '0 8px 32px rgba(15,110,86,0.16)',
      },
      keyframes: {
        'slide-in': {
          from: { transform: 'translateX(100%)' },
          to:   { transform: 'translateX(0)' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'slide-in': 'slide-in 0.25s ease-out',
        'fade-in':  'fade-in 0.2s ease-out',
      },
    },
  },
  plugins: [],
} satisfies Config