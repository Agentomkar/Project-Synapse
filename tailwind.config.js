/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: '#0A0E17',
        panel: '#0F1420',
        panel2: '#141A28',
        border: '#1F2937',
        cyan: {
          glow: '#00F0FF',
          soft: '#67E8F9',
          dim: '#164E63',
        },
        matrix: '#00FF88',
        danger: '#FF3860',
        warn: '#FFB800',
        text: '#E4E7EB',
        muted: '#8B9BB4',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s infinite',
        'scan': 'scan 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
      },
      keyframes: {
        scan: {
          '0%, 100%': { transform: 'translateY(0)', opacity: 0.5 },
          '50%': { transform: 'translateY(100%)', opacity: 0.1 },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0,240,255,0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(0,240,255,0.6)' },
        },
      },
    },
  },
  plugins: [],
}
