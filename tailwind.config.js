/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        brand:   { DEFAULT: '#F59E0B', dark: '#92610A', light: '#FCD34D' },
        surface: { DEFAULT: '#0D1520', alt: '#111C2B', raised: '#152235' },
        border:  { DEFAULT: '#1A2C42', bright: '#1E3A55', glow: '#2A4A6B' },
        risk: {
          pass:    '#10B981',
          warn:    '#F59E0B',
          blocked: '#EF4444',
        },
      },
      fontFamily: {
        sans: ['var(--font-noto)', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"Courier New"', 'Courier', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in':    'fadeIn 0.3s ease-out',
        'slide-up':   'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
}
