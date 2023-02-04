import type TurndownService from "turndown";

declare global {
  // eslint-disable-next-line no-var, @typescript-eslint/naming-convention, @typescript-eslint/consistent-type-imports
  var TurndownService: typeof import("turndown");
}

await importScripts("lib/turndown.js");

const config: TurndownService.Options = {};

const turndown = new globalThis.TurndownService(config);

export default function parse(html: string) {
  return turndown.turndown(html);
}
