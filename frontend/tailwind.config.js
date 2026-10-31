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
        sentinel: {
          darkest: '#F8FAFC',     // Page background: clean crisp soft light
          darker: '#FFFFFF',      // White surface for sidebar/navbar
          card: '#FFFFFF',        // Pure white card surfaces
          cardHover: '#F1F5F9',   // Light slate hover
          border: '#E2E8F0',      // Crisp light border
          borderLight: '#CBD5E1',
          accent: '#2563EB',      // Modern deep royal blue
          accentCyan: '#0284C7',  // Tech cyan
          accentBlue: '#3B82F6',
          success: '#10B981',
          warning: '#F59E0B',
          danger: '#EF4444',
          textMuted: '#64748B'    // Slate-500
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        'card-hover': '0 10px 25px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.04)',
      }
    },
  },
  plugins: [],
}
