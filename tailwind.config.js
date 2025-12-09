/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        handwriting: ['Segoe UI', 'Roboto', 'Helvetica', 'sans-serif'],
      },
      colors: {
        comexa: {
          blue: '#1e3a8a',
          light: '#eff6ff',
          accent: '#2563eb',
        }
      }
    },
  },
  plugins: [],
}