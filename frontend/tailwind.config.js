/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  corePlugins: {
    preflight: false, // Prevents Tailwind from resetting or overriding existing CSS styles
  },
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#ff7a18',
          hover: '#ff9b42',
          glow: 'rgba(255, 122, 24, 0.25)',
          border: 'rgba(255, 122, 24, 0.35)',
        },
      },
      fontFamily: {
        inter: ['Inter', 'system-ui', 'sans-serif'],
        outfit: ['Outfit', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
