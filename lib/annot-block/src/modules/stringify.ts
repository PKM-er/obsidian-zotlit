import { assertNever } from "assert-never";
import type { AnnotBlockWorkerAPI } from "../api";

const stringify: AnnotBlockWorkerAPI["stringify"] = (details) => {
  const excerpts = details.map(({ text: raw, alt, altType }): string => {
    if (alt) {
      if (altType === "code") {
        try {
          const altFunc = new Function("raw", `return raw.${alt}`);
          return `${altFunc(raw)}`;
        } catch (error) {
          const msg = `Failed to alter annotation "${raw}", error: ${error}`;
          console.error(msg, error);
          return `<span style="color:var(--text-error)">${raw}</span>`;
        }
      } else if (altType === "text") {
        return alt;
      } else {
        assertNever(altType);
      }
    } else {
      return raw;
    }
  });
  const links = details.map(({ url }, i) => `[annot ${i}](${url})`);
  return [excerpts.join(" "), links.join(" ")]
    .map((line) => "> " + line)
    .join("\n");
};

export default stringify;
