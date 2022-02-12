import dedent from "dedent";
import { Platform } from "obsidian";

export const promptOpenLog = () => dedent`
Press ${Platform.isMacOS ? "⌘ Cmd" : "Ctrl"} + ${
  Platform.isMacOS ? "⌥ Option" : "Shift"
} + I, then go to the "Console" tab to see the log.`;
