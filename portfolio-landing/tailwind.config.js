/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './me/index.html', './portfolio/index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // Used by the portfolio page only. Declared as HSL channels without the
      // wrapper so opacity modifiers (bg-surface/30) work.
      colors: {
        bg: 'hsl(var(--bg))',
        surface: 'hsl(var(--surface))',
        'text-primary': 'hsl(var(--text))',
        muted: 'hsl(var(--muted))',
        stroke: 'hsl(var(--stroke))',
      },
      fontFamily: {
        body: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Instrument Serif', 'Georgia', 'serif'],
      },
      keyframes: {
        'scroll-down': { '0%': { transform: 'translateY(-100%)' }, '100%': { transform: 'translateY(200%)' } },
        'role-fade-in': { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        'gradient-shift': { '0%,100%': { backgroundPosition: '0% 50%' }, '50%': { backgroundPosition: '100% 50%' } },
      },
      animation: {
        'scroll-down': 'scroll-down 1.5s ease-in-out infinite',
        'role-fade-in': 'role-fade-in 0.4s ease-out',
        'gradient-shift': 'gradient-shift 6s ease infinite',
      },
    },
  },
  plugins: [],
};
