const ui = require("@obzt/components/tailwind");

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [ui],
  // `ui.content` includes a path to the components that are using tailwind in @acme/ui
  content: ui.content.concat(["./src/setting-tab/**/*.{js,ts,jsx,tsx}"]),
};
