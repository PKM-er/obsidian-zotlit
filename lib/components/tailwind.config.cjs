/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  experimental: {
    optimizeUniversalDefaults: true,
  },
  plugins: [],
  corePlugins: {
    preflight: false,
  },
};
