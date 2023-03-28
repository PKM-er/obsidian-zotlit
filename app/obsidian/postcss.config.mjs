import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";
import discard from "postcss-discard";
import prefixSelector from "postcss-prefix-selector";

/** @type {import("postcss").Plugin} */
const prefix = prefixSelector({
  prefix: ".obzt",
  transform: (prefix, selector, prefixedSelector, _filePath, _rule) => {
    if (selector.includes(".theme-dark")) {
      return selector.replace(".theme-dark", `.theme-dark ${prefix}`);
    } else if (selector.includes(".obzt-")) {
      return selector;
    } else {
      return prefixedSelector;
    }
  },
});

export default {
  plugins: [
    tailwindcss({ config: "./tailwind.config.cjs" }),
    autoprefixer({}),
    prefix,
    discard({
      rule: ["html", "body"],
    }),
  ],
};
