/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'app-bg': 'var(--app-bg)',
        'header-bg': 'var(--header-bg)',
        'sidebar-bg': 'var(--sidebar-bg)',
        'chart-bg': 'var(--chart-bg)',
        'panel-bg': 'var(--panel-bg)',
        'panel-bg-hover': 'var(--panel-bg-hover)',
        'border-color': 'var(--border-color)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        'accent-blue': 'var(--accent-blue)',
        'chart-line': 'var(--chart-line)',
        'chart-fill': 'var(--chart-fill)',
        'chart-current': 'var(--chart-current)',
        'positive-green': 'var(--positive-green)',
        'negative-red': 'var(--negative-red)',
        'price-highlight': 'var(--price-highlight)',
      },
    },
  },
  plugins: [],
}