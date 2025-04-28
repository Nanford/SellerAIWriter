/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f7ff',
          100: '#e0f0fe',
          200: '#bae0fd',
          300: '#7dc8fc',
          400: '#38aef8',
          500: '#0e95e9',
          600: '#0276c7',
          700: '#0361a1',
          800: '#074f85',
          900: '#0c4166',
        },
        secondary: {
          50: '#f5f7fa',
          100: '#ebeef3',
          200: '#d8dfe8',
          300: '#b7c5d7',
          400: '#8fa3c0',
          500: '#6580a9',
          600: '#4a6491',
          700: '#3d5278',
          800: '#334563',
          900: '#293752',
        },
      },
      borderRadius: {
        'xl': '0.75rem',
      },
      boxShadow: {
        'card': '0 4px 10px rgba(0, 0, 0, 0.05)',
        'hover': '0 10px 20px rgba(0, 0, 0, 0.1)',
      }
    },
  },
  plugins: []
};