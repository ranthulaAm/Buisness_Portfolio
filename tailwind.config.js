/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./App.tsx",
    "./index.tsx"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
        display: ['system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
      },
      fontSize: {
        xs: ['12px', { lineHeight: '16px', letterSpacing: '0em' }], // Caption 2
        sm: ['13px', { lineHeight: '18px', letterSpacing: '-0.01em' }], // Footnote / Caption 1
        base: ['17px', { lineHeight: '22px', letterSpacing: '-0.022em' }], // Body
        lg: ['20px', { lineHeight: '25px', letterSpacing: '-0.022em' }], // Title 3
        xl: ['22px', { lineHeight: '28px', letterSpacing: '-0.026em' }], // Title 2
        '2xl': ['28px', { lineHeight: '34px', letterSpacing: '-0.026em' }], // Title 1
        '3xl': ['34px', { lineHeight: '41px', letterSpacing: '-0.026em' }], // Large Title
        '4xl': ['41px', { lineHeight: '49px', letterSpacing: '-0.026em' }],
        '5xl': ['48px', { lineHeight: '54px', letterSpacing: '-0.026em' }],
      },
      colors: {
        bg: {
          dark: '#050505',
          light: '#121212',
        },
        text: {
          light: '#E0E0E0',
          muted: '#A0A0A0',
        },
        accent: {
          purple: '#D500F9',
          magenta: '#FF1744',
          orange: '#FF9100',
          green: '#00E676',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'gradient': 'gradient 8s ease infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        }
      }
    },
  },
  plugins: [],
}
