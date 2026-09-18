/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        lime: {
          300: '#bef264',
          400: '#a3e635',
          500: '#84cc16',
        },
        emerald: {
          900: '#064e3b',
          950: '#022c22',
        }
      }
    },
  },
  plugins: [],
};
