/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(222, 47%, 11%)', // Deep space dark blue
        card: 'rgba(30, 41, 59, 0.7)',     // Frosted glass dark cards
        accent: {
          gold: 'hsl(45, 93%, 47%)',       // Game coin gold
          emerald: 'hsl(142, 70%, 45%)',    // Progression green
          violet: 'hsl(263, 70%, 50%)',     // Crystal purple
          cyan: 'hsl(180, 70%, 50%)',       // Cyber safety cyan
        }
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'sans-serif'],
      },
      animation: {
        'bounce-slow': 'bounce 2s infinite',
        'pulse-glow': 'pulseGlow 2s infinite alternate',
      },
      keyframes: {
        pulseGlow: {
          '0%': { boxShadow: '0 0 5px rgba(234, 179, 8, 0.4)' },
          '100%': { boxShadow: '0 0 20px rgba(234, 179, 8, 0.8)' },
        }
      }
    },
  },
  plugins: [],
}
