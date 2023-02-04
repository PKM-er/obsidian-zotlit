// @ts-check

import postcss from "postcss";
import postcssConfig from "../postcss.config.js";
import { readFile } from "fs/promises";

/**
 * @returns {import("esbuild").Plugin}
 */
export default function PostcssPlugin() {
  return {
    name: "postcss",
    setup: async (build) => {
      build.onLoad({ filter: /\.css$/ }, async ({ path }) => {
        const processor = postcss(postcssConfig.plugins);
        const content = await readFile(path);
        const result = await processor.process(content, { from: path });
        return {
          contents: result.toString(),
          loader: "css",
        };
      });
    },
  };
}
