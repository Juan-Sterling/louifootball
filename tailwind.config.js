/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist: [
    // Badge Kategori Produk
    'bg-emerald-700',
    'text-lime-300',
    'bg-cyan-700',
    'text-cyan-100',
    'bg-amber-600',
    'bg-purple-700',
    'bg-rose-700',
    'bg-blue-700',
    'bg-teal-700',
    'bg-emerald-800',
    'text-white',

    // Hero Promo Themes
    'bg-amber-400',
    'text-amber-950',
    'bg-amber-950/80',
    'text-amber-200',
    'border-amber-500/40',
    'bg-purple-400',
    'text-purple-950',
    'bg-purple-950/80',
    'text-purple-200',
    'border-purple-500/40',
    'bg-cyan-400',
    'text-cyan-950',
    'bg-cyan-950/80',
    'text-cyan-200',
    'border-cyan-500/40',
    'bg-rose-400',
    'text-rose-950',
    'bg-rose-950/80',
    'text-rose-200',
    'border-rose-500/40',
    'bg-lime-400',
    'text-emerald-950',
    'bg-emerald-800/80',
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
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        }
      }
    },
  },
  plugins: [],
};
