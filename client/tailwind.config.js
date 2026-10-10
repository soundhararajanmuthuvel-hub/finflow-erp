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
        maroon: {
          50: '#FDF2F2',
          100: '#FCE7E7',
          200: '#F8CFCF',
          300: '#F2A8A8',
          400: '#E67575',
          500: '#D44A4A',
          600: '#B82C2C',
          700: '#9B1F1F',
          800: '#8B1A1A', // FinFlow brand primary
          900: '#6E1414',
          950: '#4A0B0B',
        },
        gold: {
          50: '#FEF9EE',
          100: '#FDF1D6',
          200: '#FBE2AD',
          300: '#F8CE7A',
          400: '#F3B443',
          500: '#D97706',
          600: '#B7791F', // Turmeric accent
          700: '#925B15',
          800: '#754716',
          900: '#603A17',
        },
        surface: {
          bg: '#F8FAFC',     // Modern soft warm/neutral gray
          card: '#FFFFFF',   // Pure crisp white
          border: '#E2E8F0', // Subtle modern border
          'border-subtle': '#F1F5F9',
          hover: '#F8FAFC',  // Hover background
          subtle: '#F1F5F9', // Secondary subtle surface
        },
        status: {
          success: '#059669',
          'success-bg': '#ECFDF5',
          'success-border': '#A7F3D0',
          warning: '#D97706',
          'warning-bg': '#FFFBEB',
          'warning-border': '#FDE68A',
          danger: '#DC2626',
          'danger-bg': '#FEF2F2',
          'danger-border': '#FECACA',
          info: '#2563EB',
          'info-bg': '#EFF6FF',
          'info-border': '#BFDBFE',
        },
        content: {
          primary: '#0F172A',   // Slate 900
          secondary: '#334155', // Slate 700
          muted: '#64748B',     // Slate 500
          light: '#94A3B8',     // Slate 400
        }
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],      // 12px
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
        'base': ['1rem', { lineHeight: '1.5rem' }],     // 16px
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
        '2xl': ['1.5rem', { lineHeight: '2rem' }],      // 24px
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],   // 36px
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.04)',
        'card-hover': '0 10px 25px -5px rgba(15, 23, 42, 0.06), 0 8px 10px -6px rgba(15, 23, 42, 0.03)',
        'warm': '0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.04)',
        'warm-lg': '0 6px 16px -2px rgba(15, 23, 42, 0.06), 0 2px 6px -2px rgba(15, 23, 42, 0.04)',
        'modal': '0 25px 50px -12px rgba(15, 23, 42, 0.2)',
      }
    },
  },
  plugins: [],
}
