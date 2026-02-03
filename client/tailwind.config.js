/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#020617', // slate-950
        primary: {
          DEFAULT: '#6366f1', // indigo-500
          dark: '#4f46e5', // indigo-600
          light: '#818cf8', // indigo-400
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
