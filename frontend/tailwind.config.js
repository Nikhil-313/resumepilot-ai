/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: {
          dark: '#0B0F19',  // Deep charcoal background
          card: '#111827',  // Slate dark card background
          glass: 'rgba(17, 24, 39, 0.7)',
        },
        brand: {
          indigo: '#6366F1', // Primary brand action indigo
          cyan: '#06B6D4',   // AI highlight cyan glow
          emerald: '#10B981',// High ATS score / success
          amber: '#F59E0B',  // Action needed warning
          rose: '#EF4444',   // Critical missing skill
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-cyan': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 15px rgba(6, 182, 212, 0.3)' },
          '100%': { boxShadow: '0 0 30px rgba(6, 182, 212, 0.7)' },
        },
      },
    },
  },
  plugins: [],
}
