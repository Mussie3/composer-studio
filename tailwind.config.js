/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Primary brand: indigo→violet
        brand: {
          50: '#F2F1FE',
          100: '#E5E4FD',
          200: '#CDC9FB',
          300: '#A9A3F6',
          400: '#867CEF',
          500: '#5B5FE3',
          600: '#4948CC',
          700: '#3C3CA4',
          800: '#2F2F80',
          900: '#1F1F55',
        },
        // Cool, warm-leaning ink
        ink: {
          50: '#F7F8FB',
          100: '#EDEFF5',
          200: '#DDE0EB',
          300: '#B9BECF',
          400: '#7B82A0',
          500: '#525A7A',
          600: '#363D5A',
          700: '#262C44',
          800: '#1A1F33',
          900: '#0F1226',
        },
        // Surface tokens
        surface: {
          DEFAULT: '#F4F5FB',
          panel: '#FFFFFF',
          sunk: '#EEF0F8',
          inset: '#F8F9FD',
        },
        // Element tile accents (matches NavigationPanel block-type tiles)
        accent: {
          text: { from: '#5B5FE3', to: '#867CEF' },
          heading: { from: '#8A5CFF', to: '#B57DFF' },
          image: { from: '#EC4899', to: '#F472B6' },
          button: { from: '#F97316', to: '#FB923C' },
          divider: { from: '#14B8A6', to: '#2DD4BF' },
          spacer: { from: '#64748B', to: '#94A3B8' },
        },
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        display: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'Consolas', 'monospace'],
      },
      letterSpacing: {
        display: '-0.03em',
        'display-tight': '-0.04em',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(15, 18, 38, 0.04), 0 4px 12px rgba(15, 18, 38, 0.04)',
        card: '0 1px 2px rgba(15, 18, 38, 0.06), 0 12px 32px -8px rgba(91, 95, 227, 0.18)',
        floating: '0 8px 24px -6px rgba(15, 18, 38, 0.18)',
        glow: '0 0 0 4px rgba(91, 95, 227, 0.12)',
      },
      backgroundImage: {
        'app-gradient': 'radial-gradient(1200px 600px at 0% 0%, #ECECFD 0%, transparent 60%), radial-gradient(900px 500px at 100% 100%, #F0E8FF 0%, transparent 60%), #F4F5FB',
      },
    },
  },
  plugins: [],
}
