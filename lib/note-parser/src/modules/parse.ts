import type TurndownService from "turndown";

const parser = new DOMParser();
const parseHTML = (html: string) => {
  return parser.parseFromString(html, "text/html");
};

// const loadScript = (src: string) =>
//   new Promise<void>((resolve, reject) => {
//     const script = document.createElement("script");
//     script.src = src;
//     script.onload = () => resolve();
//     script.onerror = () => reject();
//     document.head.appendChild(script);
//   });

declare global {
  // eslint-disable-next-line no-var, @typescript-eslint/naming-convention, @typescript-eslint/consistent-type-imports
  var TurndownService: typeof import("turndown");
  // eslint-disable-next-line no-var, @typescript-eslint/naming-convention, @typescript-eslint/consistent-type-imports
  var importScripts: (...src: string[]) => Promise<void>;
}

await importScripts("lib/turndown.js");

const config: TurndownService.Options = {};

const turndown = new window.TurndownService(config);

export default function parse(html: string) {
  const doc = parseHTML(html);
  return turndown.turndown(doc.body);
}
