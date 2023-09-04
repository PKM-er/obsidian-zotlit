/* eslint-disable deprecation/deprecation */
import type { App } from "obsidian";

export function getActiveWin(app: App) {
  return app.workspace.activeLeaf?.containerEl.win ?? window;
}
