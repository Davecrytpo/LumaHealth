/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    screens: {
      sm: '390px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1440px',
    },
    extend: {
      colors: {
        canvas: 'var(--lh-canvas)',
        surface: 'var(--lh-surface)',
        ink: 'var(--lh-ink)',
        muted: 'var(--lh-muted)',
        terracotta: 'var(--lh-terracotta)',
        'terracotta-soft': 'var(--lh-terracotta-soft)',
        sage: 'var(--lh-sage)',
        'sage-soft': 'var(--lh-sage-soft)',
        honey: 'var(--lh-honey)',
        dark: 'var(--lh-dark)',
        line: 'var(--lh-line)',
        btn: 'var(--lh-btn)',
        'btn-fg': 'var(--lh-btn-fg)',
      },
      fontFamily: {
        display: ['"DM Serif Display"', 'Georgia', 'serif'],
        sans: ['Manrope', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        lh: '10px',
      },
      boxShadow: {
        lh: '0 1px 0 rgba(32, 39, 36, 0.04)',
      },
      maxWidth: {
        page: '72rem',
        prose: '40rem',
      },
    },
  },
  plugins: [],
}
