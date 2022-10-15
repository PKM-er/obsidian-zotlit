import { assertNever } from "assert-never";
import type { AnnotBlockWorkerAPI } from "../api";

const stringify: AnnotBlockWorkerAPI["stringify"] = (details) => {
  const excerpts = details.map(({ text: raw, alt, altType }): string => {
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
    } else if (altType === "none") {
      return raw;
    } else assertNever(altType);
  });
  const links = details.map(({ url, altType, alt }, i) => {
    const linktext =
      altType === "none" && alt && !reservedLinktext.has(alt.toLowerCase())
        ? alt
        : i > 0
        ? i
        : "annot";
    return `[${linktext}](${url})`;
  });
  return [excerpts.join(" ") + " " + links.join(" ")]
    .map((line) => "> " + line)
    .join("\n");
};

const reservedLinktext = new Set(["zotero", "annot"]);

export default stringify;
