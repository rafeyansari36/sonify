/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}"
  ],
  theme: {
    extend: {
      colors: {
        'sonify-bg': '#0a0a0f',
        'sonify-surface': '#15151f',
        'sonify-accent': '#a78bfa',
        'sonify-accent-2': '#22d3ee',
      },
      fontFamily: {
        'display': ['"Space Grotesk"', 'sans-serif'],
        'mono': ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 20px rgba(167, 139, 250, 0.5)' },
          '50%': { opacity: '0.8', boxShadow: '0 0 40px rgba(167, 139, 250, 0.8)' },
        }
      }
    },
  },
  plugins: [],
}
