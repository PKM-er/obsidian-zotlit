import { resolve } from "path";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react({}), dts({ entryRoot: "src/components/" }), tsconfigPaths()],
  resolve: {
    alias: {
      path: "path-browserify",
    },
  },
  build: {
    lib: {
      entry: [resolve(__dirname, "src/components/index.tsx")],
      fileName: "index",
      formats: ["es"],
    },
    target: "esnext",
    rollupOptions: {
      external: ["react", "react/jsx-runtime", "path"],
      output: {
        assetFileNames: (assetInfo) =>
          assetInfo.name === "style.css" ? "styles.css" : assetInfo.name,
      },
    },
  },
});
