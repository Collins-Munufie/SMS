/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ghana: {
          gold: "#fcd116",
          green: "#006b3f",
          red: "#ce1126",
          black: "#000000",
          navy: "#0f172a",
        },
      },
    },
  },
  plugins: [],
}
