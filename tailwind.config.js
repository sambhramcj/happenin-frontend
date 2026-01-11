/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          primary: "#1a0b2e",
          secondary: "#2d1b4e",
          tertiary: "#3d2a5e",
        },
        purple: {
          dark: "#6b21a8",
          DEFAULT: "#9333ea",
          light: "#a855f7",
          lighter: "#c084fc",
        },
      },
    },
  },
  plugins: [],
};
