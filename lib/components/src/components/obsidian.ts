import type { ReactNode } from "react";
import { createContext } from "react";

// eslint-disable-next-line @typescript-eslint/ban-types
export interface ObsidianContextType {
  sanitize(html: string): string;
  setIcon(parent: HTMLElement, iconId: string): void;
  renderMarkdown(content: string): ReactNode;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const ObsidianContext = createContext({} as ObsidianContextType);
