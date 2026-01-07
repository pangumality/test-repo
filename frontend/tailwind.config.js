/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#e6f3fa',
          100: '#cbe7f5',
          500: '#0ea5e9',
          600: '#0284c7'
        },
        surface: {
          50: '#f8fafc',
          100: '#f1f5f9'
        },
        text: {
          base: '#0f172a',
          muted: '#475569'
        },
        accent: '#0ea5e9',
        danger: '#ef4444',
        success: '#22c55e',
        warning: '#eab308',
        purple: '#a855f7',
        'sidebar-bg': '#0b1220',
        'sidebar-border': '#1f2937',
        'sidebar-hover': '#111827',
      },
      boxShadow: {
        soft: '0 6px 16px rgba(0,0,0,0.06)',
      },
      borderRadius: {
        xl: '0.9rem',
      }
    },
  },
  plugins: [],
}
