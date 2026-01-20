/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        primaryHover: 'var(--color-primary-hover)',
        primarySoft: 'var(--color-primary-soft)',

        // Override legacy palettes so older classes map to the new brand system
        purple: {
          50: '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#8B5CF6',
          600: 'var(--color-primary)', // brand violet
          700: '#5B21B6',
          800: '#4C1D95',
          900: '#2E1065',
        },
        pink: {
          50: '#FDF2F8',
          100: '#FCE7F3',
          200: '#FBCFE8',
          300: '#F9A8D4',
          400: '#F472B6',
          500: '#EC4899',
          600: '#DB2777',
          700: '#BE185D',
          800: '#9D174D',
          900: '#831843',
        },

        bg: {
          default: 'var(--bg-default)',
          muted: 'var(--bg-muted)',
          card: 'var(--bg-card)',
        },

        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
          inverse: 'var(--text-inverse)',
        },

        border: {
          default: 'var(--border-default)',
          muted: 'var(--border-muted)',
          focus: 'var(--border-focus)',
        },

        success: 'var(--success)',
        successSoft: 'var(--success-soft)',
        warning: 'var(--warning)',
        warningSoft: 'var(--warning-soft)',
        error: 'var(--error)',
        errorSoft: 'var(--error-soft)',
        info: 'var(--info)',
        infoSoft: 'var(--info-soft)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        pill: 'var(--radius-pill)',
      },
      boxShadow: {
        card: 'var(--shadow-md)',
        sm: 'var(--shadow-sm)',
        lg: 'var(--shadow-lg)',
      },
      transitionDuration: {
        fast: '120ms',
        medium: '200ms',
        slow: '320ms',
      },
      transitionTimingFunction: {
        standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
        enter: 'cubic-bezier(0.0, 0, 0.2, 1)',
        exit: 'cubic-bezier(0.4, 0, 1, 1)',
      },
      scale: {
        press: '0.98',
        hover: '1.02',
      },
    },
  },
  plugins: [],
};
