const { join } = require("path");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    ...[/* "./index.html", */ "./src/**/*.{js,ts,jsx,tsx}"].map((p) =>
      join(__dirname, p),
    ),
  ],
  // should do this in postcss
  // prefix: "oz-",
  experimental: {
    optimizeUniversalDefaults: true,
  },
  plugins: [
    require("@tailwindcss/container-queries"),
    require("@tailwindcss/line-clamp"),
    require("@tailwindcss/forms")({ strategy: "class" }),
    require("@tailwindcss/typography"),
    require("tailwindcss-animate"),
  ],
  corePlugins: {
    preflight: false,
  },
};
