import type { ObsidianContextType } from "@obzt/components";
import { setIcon } from "obsidian";

export const context: ObsidianContextType = {
  sanitize: DOMPurify.sanitize.bind(DOMPurify),
  setIcon,
};
