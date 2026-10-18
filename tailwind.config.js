/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  future: {
    hoverOnlyWhenSupported: true,
  },
  theme: {
    extend: {
      backgroundColor: {
        white: 'rgb(var(--tone-surface) / <alpha-value>)',
        gray: {
          50: 'rgb(var(--tone-canvas) / <alpha-value>)',
          100: 'rgb(var(--tone-muted) / <alpha-value>)',
          200: 'rgb(var(--tone-chip) / <alpha-value>)',
          600: 'rgb(var(--tone-control) / <alpha-value>)',
          700: 'rgb(var(--tone-inset-bg) / <alpha-value>)',
          800: 'rgb(var(--tone-panel-bg) / <alpha-value>)',
          900: 'rgb(var(--tone-deep-bg) / <alpha-value>)',
        },
      },
      borderColor: {
        gray: {
          100: 'rgb(var(--tone-border-soft) / <alpha-value>)',
          200: 'rgb(var(--tone-border) / <alpha-value>)',
          700: 'rgb(var(--tone-border-dark) / <alpha-value>)',
        },
      },
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(8px) translateY(-50%)', opacity: '0' },
          '100%': { transform: 'translateX(0) translateY(-50%)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        truck: {
          '0%, 100%': { transform: 'translateY(0)' },
          '35%': { transform: 'translateY(-8px)' },
          '50%': { transform: 'translateY(0)' },
          '70%': { transform: 'translateY(-3px)' },
          '85%': { transform: 'translateY(0)' },
        },
        wheel: {
          to: { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        slideIn: 'slideIn 0.3s ease-out',
        fadeIn: 'fadeIn 0.3s ease-out',
        fadeInUp: 'fadeInUp 0.4s ease-out forwards',
        truck: 'truck 0.8s ease-in-out infinite',
        wheel: 'wheel 0.45s linear infinite',
      },
    },
  },
  plugins: [],
}

