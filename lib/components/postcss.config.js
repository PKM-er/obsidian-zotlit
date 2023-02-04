import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";
import discard from "postcss-discard";
import prefixSelector from "postcss-prefix-selector";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

/** @type {import("postcss").Plugin} */
const prefix = prefixSelector({
  prefix: ".obzt",
  transform: (prefix, selector, prefixedSelector, _filePath, _rule) => {
    if (selector.includes(".obzt-")) {
      return selector;
    } else {
      return prefixedSelector;
    }
  },
});

const __filename = fileURLToPath(import.meta.url),
  __dirname = dirname(__filename);

export default {
  plugins: [
    tailwindcss({ config: join(__dirname, "tailwind.config.cjs") }),
    autoprefixer({}),
    prefix,
    discard({
      rule: ["html", "body"],
    }),
  ],
};
