/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0b132b',
          950: '#070b18',
        },
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
      },
      boxShadow: {
        '2xs': '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'card': '0 2px 8px -2px rgba(15, 23, 42, 0.04), 0 1px 4px -1px rgba(15, 23, 42, 0.02)',
        'card-hover': '0 10px 25px -5px rgba(15, 23, 42, 0.06), 0 8px 10px -6px rgba(15, 23, 42, 0.04)',
        'glow-sky': '0 0 25px -5px rgba(56, 189, 248, 0.4)',
      },
      keyframes: {
        flashGreen: {
          '0%, 100%': { backgroundColor: 'transparent' },
          '20%, 80%': { backgroundColor: 'rgba(34, 197, 94, 0.18)' }
        },
        flashRed: {
          '0%, 100%': { backgroundColor: 'transparent' },
          '20%, 80%': { backgroundColor: 'rgba(239, 68, 68, 0.18)' }
        },
        flashSky: {
          '0%, 100%': { backgroundColor: 'transparent' },
          '20%, 80%': { backgroundColor: 'rgba(56, 189, 248, 0.22)' }
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.6', transform: 'scale(1.2)' }
        }
      },
      animation: {
        'flash-green': 'flashGreen 1.5s ease-in-out',
        'flash-red': 'flashRed 1.5s ease-in-out',
        'flash-sky': 'flashSky 1.5s ease-in-out',
        'pulse-glow': 'pulseGlow 2s infinite'
      }
    },
  },
  plugins: [],
}
