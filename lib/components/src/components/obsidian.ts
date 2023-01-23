import { createContext } from "react";

// eslint-disable-next-line @typescript-eslint/ban-types
export interface ObsidianContextType {
  sanitize(html: string): string;
  setIcon(parent: HTMLElement, iconId: string): void;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const ObsidianContext = createContext({} as ObsidianContextType);
