/// <reference lib="dom" />

// firefox bootstrap extension has broken `window` in content script...
// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
// Cu.importGlobalProperties(globals); won't work for setTimeout, fetch...
const requirePatch: (keyof typeof globalThis)[] = [
  "setTimeout",
  "clearTimeout",
  "fetch",
  "URL",
];

export const defineGlobals = Object.fromEntries(
  requirePatch.map((n) => [n, `mainWindow.${n}`] as const),
);
