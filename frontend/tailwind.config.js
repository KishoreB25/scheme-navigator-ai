/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        saffron: '#FF9500',
        'bharat-green': '#138808',
        'bharat-blue': '#003DA5',
        'gov-bg': '#F5F5F5',
        eligible: '#10B981',
        ineligible: '#EF4444',
      },
      fontFamily: {
        sans: ['system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
        heading: ['system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['ui-monospace', 'Consolas', 'monospace'],
      },
      animation: {
        'pulse-dot': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
