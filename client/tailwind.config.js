/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        pitch: {
          950: '#06120d',
          900: '#0b1f16',
          800: '#123024',
        },
        // "neon" tokens are kept as names for compatibility, but retuned to a
        // refined emerald-&-gold luxe palette (softer, warmer, less arcade).
        neon: {
          green: '#34d399', // emerald — primary accent
          lime: '#a7f3d0', // soft mint
          cyan: '#5eead4', // teal — cool partner to emerald
          gold: '#e8c26a', // warm gold — luxe accent / money
          pink: '#e0729a', // muted rose — danger / fire sale
        },
        sand: '#e9e2cf', // warm ivory text
      },
      fontFamily: {
        display: ['"Rajdhani"', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        neon: '0 0 22px rgba(52,211,153,0.26)',
        'neon-strong': '0 0 34px rgba(52,211,153,0.42)',
        gold: '0 0 26px rgba(232,194,106,0.34)',
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
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-150%) skewX(-12deg)' },
          '100%': { transform: 'translateX(250%) skewX(-12deg)' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 18px rgba(57,255,136,0.25)' },
          '50%': { boxShadow: '0 0 34px rgba(57,255,136,0.6)' },
        },
        'gradient-x': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'bounce-in': {
          '0%': { transform: 'scale(0.85) translateY(12px)', opacity: '0' },
          '60%': { transform: 'scale(1.03) translateY(0)', opacity: '1' },
          '100%': { transform: 'scale(1)' },
        },
        'stamp-in': {
          '0%': { transform: 'scale(2.4) rotate(-14deg)', opacity: '0' },
          '55%': { transform: 'scale(0.92) rotate(-6deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(-6deg)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'count-pop': {
          '0%': { transform: 'translateY(6px) scale(0.9)', opacity: '0' },
          '100%': { transform: 'translateY(0) scale(1)', opacity: '1' },
        },
        shine: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'card-flip': 'card-flip 0.7s ease-out',
        'pop-in': 'pop-in 0.25s ease-out',
        'pulse-ring': 'pulse-ring 1.2s ease-out infinite',
        'slide-up': 'slide-up 0.3s ease-out',
        shake: 'shake 0.5s',
        float: 'float 3s ease-in-out infinite',
        shimmer: 'shimmer 2.4s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 2.2s ease-in-out infinite',
        'gradient-x': 'gradient-x 4s ease infinite',
        'bounce-in': 'bounce-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'stamp-in': 'stamp-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'fade-in': 'fade-in 0.5s ease-out both',
        'count-pop': 'count-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
        shine: 'shine 3.5s linear infinite',
      },
    },
  },
  plugins: [],
}
