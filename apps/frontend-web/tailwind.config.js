/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    '../../packages/ui/**/*.{js,ts,jsx,tsx}',
    '../../packages/ai-components/**/*.{js,ts,jsx,tsx}',
  ],
  safelist: [
    'animate-pulse-red',
    'animate-pulse-blue',
    'animate-pulse-green',
    'animate-pulse-gray',
  ],
  theme: {
    extend: {
      colors: {
        tron: {
          glow: '#00ffff',
          cyan: '#0ff',
          dark: '#001018',
        },
      },
      fontFamily: {
        orbitron: ['Orbitron', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        tronGlow: '0 0 20px #00FFFF, 0 0 40px #0099FF',
      },
    },
  },
  plugins: [],
};
