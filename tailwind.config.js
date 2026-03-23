/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        primary: '#22C55E',
        accent: '#3B82F6',
        background: '#F8FAFC',
        textPrimary: '#0F172A',
      },
      backgroundImage: {
        'page-gradient': 'linear-gradient(135deg, #F8FAFC 0%, #E6F6FF 50%, #F0FBFF 100%)',
        'dark-gradient': 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)',
      },
    },
  },
  plugins: [],
}
