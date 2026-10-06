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
          800: '#8B1A1A', // Kungumam primary
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
          bg: '#FAF7F2',     // Warm off-white
          card: '#FFFFFF',   // Pure crisp white
          border: '#D6CFC4', // Warm border
          hover: '#F3EFEA',  // Subtle hover
          subtle: '#EDE7DE', // Secondary subtle surface
        },
        status: {
          success: '#1F6B3A',
          'success-bg': '#EAF5EE',
          'success-border': '#A7D9B7',
          warning: '#B45309',
          'warning-bg': '#FEF3C7',
          'warning-border': '#FDE68A',
          danger: '#B91C1C',
          'danger-bg': '#FEE2E2',
          'danger-border': '#FECACA',
          info: '#1E3A8A',
          'info-bg': '#EFF6FF',
          'info-border': '#BFDBFE',
        },
        content: {
          primary: '#1A1A1A',   // 16:1 contrast
          secondary: '#3F3F46', // 7:1 contrast
          muted: '#52525B',     // 4.8:1 contrast
          light: '#71717A',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'xs': ['0.875rem', { lineHeight: '1.4' }],    // 14px (minimum allowed anywhere)
        'sm': ['1rem', { lineHeight: '1.5' }],        // 16px
        'base': ['1.125rem', { lineHeight: '1.55' }], // 18px (standard body base)
        'lg': ['1.25rem', { lineHeight: '1.5' }],     // 20px
        'xl': ['1.5rem', { lineHeight: '1.4' }],      // 24px (H3)
        '2xl': ['1.875rem', { lineHeight: '1.3' }],   // 30px (H2)
        '3xl': ['2.25rem', { lineHeight: '1.25' }],   // 36px (H1)
        '4xl': ['2.75rem', { lineHeight: '1.2' }],    // 44px (KPI Numbers)
      },
      boxShadow: {
        'warm': '0 2px 8px -1px rgba(139, 26, 26, 0.06), 0 1px 3px 0 rgba(0, 0, 0, 0.04)',
        'warm-lg': '0 8px 24px -4px rgba(139, 26, 26, 0.08), 0 4px 8px -2px rgba(0, 0, 0, 0.04)',
        'modal': '0 20px 40px -10px rgba(0, 0, 0, 0.25)',
      }
    },
  },
  plugins: [],
}
