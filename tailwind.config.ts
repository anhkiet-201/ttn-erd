import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: 'hsl(210, 100%, 56%)',
        secondary: 'hsl(280, 80%, 65%)',
        success: 'hsl(142, 71%, 45%)',
        warning: 'hsl(45, 100%, 51%)',
        danger: 'hsl(4, 90%, 58%)',
        'status-active': 'hsl(142, 71%, 45%)',
        'status-inactive': 'hsl(0, 0%, 60%)',
        'card-bg-1': 'hsl(45, 100%, 85%)',
        'card-bg-2': 'hsl(4, 90%, 85%)',
        'card-bg-3': 'hsl(142, 71%, 85%)',
        'card-bg-4': 'hsl(210, 100%, 85%)',
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'sm': '0 1px 3px rgba(0, 0, 0, 0.12)',
        'md': '0 4px 6px rgba(0, 0, 0, 0.12)',
        'lg': '0 10px 20px rgba(0, 0, 0, 0.15)',
      },
      borderRadius: {
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
      },
      transitionDuration: {
        'fast': '150ms',
        'base': '250ms',
        'slow': '350ms',
      },
    },
  },
  plugins: [],
};

export default config;
