/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        emerald: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#16A765',
          600: '#138e55',
          700: '#0f7244',
          800: '#0c5835',
          900: '#083c24',
          950: '#042214',
        },
        navy: {
          50: '#f0f5fc',
          100: '#e1ebf9',
          200: '#c3d8f3',
          300: '#94bbed',
          400: '#5e96e4',
          500: '#3978dc',
          600: '#235ecd',
          700: '#1b4ab4',
          800: '#0F386E',
          900: '#08264B',
          950: '#04152a',
        },
        brand: {
          blue: '#1263F1',
          navy: '#08264B',
          bg: '#F4F7FB',
          text: '#15243A',
          muted: '#66758A',
          green: '#16A765',
          amber: '#E9A11B',
          error: '#DC2626',
        },
        charcoal: {
          50: '#F4F7FB',
          100: '#ebf0f7',
          200: '#dde5f0',
          300: '#c5d2e2',
          400: '#9eb0c6',
          500: '#66758A',
          600: '#4d5c70',
          700: '#354356',
          800: '#222f41',
          900: '#15243A',
          950: '#0a1420',
        },
      },
      outlineColor: {
        'brand-blue': '#1263F1',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-in': 'slideIn 0.2s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
