import { resolve } from "path";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react({}), dts({ entryRoot: "src/components/" })],
  build: {
    lib: {
      entry: [resolve(__dirname, "src/components/index.tsx")],
      fileName: "index",
      formats: ["es"],
    },
    target: "esnext",
    rollupOptions: {
      external: ["react", "react/jsx-runtime"],
      output: {
        assetFileNames: (assetInfo) =>
          assetInfo.name === "style.css" ? "styles.css" : assetInfo.name,
      },
    },
  },
});
