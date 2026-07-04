/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        pitch: {
          950: '#04140c',
          900: '#07200f',
          800: '#0b3018',
        },
        neon: {
          green: '#39ff88',
          lime: '#c6ff4d',
          cyan: '#25e5ff',
          gold: '#ffd24a',
          pink: '#ff4d8d',
        },
      },
      fontFamily: {
        display: ['"Rajdhani"', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        neon: '0 0 20px rgba(57,255,136,0.35)',
        'neon-strong': '0 0 32px rgba(57,255,136,0.55)',
      },
      keyframes: {
        'card-flip': {
          '0%': { transform: 'rotateY(90deg) scale(0.8)', opacity: '0' },
          '60%': { transform: 'rotateY(-12deg) scale(1.05)', opacity: '1' },
          '100%': { transform: 'rotateY(0deg) scale(1)', opacity: '1' },
        },
        'pop-in': {
          '0%': { transform: 'scale(0.7)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'pulse-ring': {
          '0%': { boxShadow: '0 0 0 0 rgba(57,255,136,0.6)' },
          '100%': { boxShadow: '0 0 0 18px rgba(57,255,136,0)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        shake: {
          '10%, 90%': { transform: 'translateX(-1px)' },
          '20%, 80%': { transform: 'translateX(2px)' },
          '30%, 50%, 70%': { transform: 'translateX(-4px)' },
          '40%, 60%': { transform: 'translateX(4px)' },
        },
      },
      animation: {
        'card-flip': 'card-flip 0.7s ease-out',
        'pop-in': 'pop-in 0.25s ease-out',
        'pulse-ring': 'pulse-ring 1.2s ease-out infinite',
        'slide-up': 'slide-up 0.3s ease-out',
        shake: 'shake 0.5s',
      },
    },
  },
  plugins: [],
}
