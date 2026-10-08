/** @type {import('tailwindcss').Config} */
module.exports = {
  future: { hoverOnlyWhenSupported: true },
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        'primary-dark': 'var(--color-primary-dark)',
        'primary-soft': 'var(--color-primary-soft)',
        accent: 'var(--color-accent)',
        canvas: 'var(--color-canvas)',
        surface: 'var(--color-surface)',
        'surface-raised': 'var(--color-surface-raised)',
        ink: 'var(--color-ink)',
        muted: 'var(--color-muted)',
        border: 'var(--color-border)',
        'border-strong': 'var(--color-border-strong)',
        danger: 'var(--color-danger)',
        'danger-soft': 'var(--color-danger-soft)',
        success: 'var(--color-success)',
        'success-soft': 'var(--color-success-soft)',
        warning: 'var(--color-warning)',
        'warning-soft': 'var(--color-warning-soft)',
        'danger-warm': 'var(--color-danger-warm)',
        'success-muted': 'var(--color-success-muted)',
        'warning-warm': 'var(--color-warning-warm)',
        'glow-soft': 'var(--color-glow-soft)'
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      },
      boxShadow: {
        modal: '0 24px 70px rgb(20 34 28 / 24%)',
        'glow-soft': 'var(--shadow-glow-soft)'
      }
    }
  },
  plugins: []
};
