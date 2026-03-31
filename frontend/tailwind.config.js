/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0B0F19', // Premium midnight dark slate
        surface: '#161F30', // Card dark slate
        'surface-hover': '#1F2B42', // Card hover state
        primary: '#F59E0B', // Saffron Gold (brand color)
        secondary: '#FBBF24', // Lighter Saffron Gold
        accent: '#8B5CF6', // Royal tech purple
        'bharat-saffron': '#FF9500',
        'bharat-green': '#138808',
        'bharat-blue': '#003DA5',
        eligible: '#10B981',
        ineligible: '#EF4444',
        border: '#1E293B',
      },
      fontFamily: {
        sans: ['Lato', 'system-ui', 'sans-serif'],
        display: ['"EB Garamond"', 'Georgia', 'serif'],
      },
      animation: {
        'pulse-dot': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out forwards',
        'blob': 'blob 7s infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        }
      },
      boxShadow: {
        'glass': '0 4px 30px rgba(0, 0, 0, 0.2)',
        'glow': '0 0 15px rgba(245, 158, 11, 0.25)',
        'glow-purple': '0 0 15px rgba(139, 92, 246, 0.3)',
      }
    },
  },
  plugins: [],
}
