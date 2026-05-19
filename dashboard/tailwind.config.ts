import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0f0f0f',
        surface: '#1a1a1a',
        'surface-2': '#242424',
        border: '#2a2a2a',
        accent: '#6366f1',
        'accent-dim': 'rgba(99, 102, 241, 0.15)',
        'accent-glow': 'rgba(99, 102, 241, 0.35)',
        muted: '#94a3b8',
        danger: '#ef4444',
        warning: '#f59e0b',
        success: '#22c55e',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
