import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#7ab8a0',
          dark: '#5a9a82',
          light: '#a0d4be',
          50: '#f0f7f4',
          100: '#dceee5',
          200: '#b9ddcb',
        },
        accent: {
          DEFAULT: '#f2a7b3',
          dark: '#e8899a',
          light: '#f7c5cd',
          50: '#fef5f6',
          100: '#fde8ec',
          200: '#f9d1d8',
        },
        surface: {
          DEFAULT: '#faf8f5',
          warm: '#f5f0eb',
          card: '#ffffff',
        },
        text: {
          main: '#4a5568',
          muted: '#8a9aaa',
          light: '#b0bec5',
        },
        danger: '#ef4444',
        success: '#22c55e',
        warning: '#f59e0b',
      },
      fontFamily: {
        display: ['"Quicksand"', 'sans-serif'],
        body: ['"Nunito"', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 2px 15px rgba(122, 184, 160, 0.1)',
        medium: '0 4px 20px rgba(122, 184, 160, 0.15)',
        pink: '0 4px 20px rgba(242, 167, 179, 0.2)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'bounce-in': 'bounceIn 0.6s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '50%': { transform: 'scale(1.02)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
