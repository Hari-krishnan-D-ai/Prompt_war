/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  // The zero-gravity theme is toggled by adding data-theme="zero-gravity" to <html>
  // We use a CSS variable approach so Tailwind's arbitrary values stay clean.
  darkMode: ['class', '[data-theme="zero-gravity"]'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Neon-blue zero-gravity palette (Phase 4)
        'zg': {
          50:  '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
          neon: '#00d4ff',
          glow: '#00aaff',
        },
      },
      keyframes: {
        // Eco-positive log: soft green pulse
        'eco-pulse': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(16, 185, 129, 0)' },
          '50%':       { boxShadow: '0 0 0 8px rgba(16, 185, 129, 0.3)' },
        },
        // High-emission alert: amber flash
        'alert-flash': {
          '0%, 100%': { backgroundColor: 'transparent' },
          '50%':       { backgroundColor: 'rgba(245, 158, 11, 0.15)' },
        },
        // Zero-gravity mode transition glow
        'gravity-glow': {
          '0%, 100%': { boxShadow: '0 0 12px 2px rgba(0, 212, 255, 0.4)' },
          '50%':       { boxShadow: '0 0 24px 6px rgba(0, 212, 255, 0.7)' },
        },
        // Sidebar collapse
        'slide-in': {
          from: { transform: 'translateX(-100%)' },
          to:   { transform: 'translateX(0)' },
        },
        // Spinner for loading states
        'spin-slow': {
          to: { transform: 'rotate(360deg)' },
        },
        // Number counter animation
        'count-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'eco-pulse':    'eco-pulse 2s ease-in-out infinite',
        'alert-flash':  'alert-flash 1.5s ease-in-out infinite',
        'gravity-glow': 'gravity-glow 2.5s ease-in-out infinite',
        'slide-in':     'slide-in 0.25s ease-out',
        'spin-slow':    'spin-slow 3s linear infinite',
        'count-up':     'count-up 0.4s ease-out',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
