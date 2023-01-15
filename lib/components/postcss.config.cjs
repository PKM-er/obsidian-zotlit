module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    "postcss-discard": {
      rule: ["html", "body"],
    },
    "postcss-prefix-selector": {
      prefix: ".obzt",
      // transform: (prefix, selector, prefixedSelector, _filePath, _rule) => {
      //   if (selector === "html") {
      //     return "html" + prefix;
      //   } else {
      //     return prefixedSelector;
      //   }
      // },
    },
  },
};
