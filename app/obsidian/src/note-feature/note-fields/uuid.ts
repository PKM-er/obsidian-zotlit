const alphabet = `0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz-`;

import escapeStringRegexp from "escape-string-regexp";
import { customAlphabet } from "nanoid";

// https://zelark.github.io/nano-id-cc/
const size = 6;
export const nanoid = customAlphabet(alphabet, size);
const pattern = new RegExp(`#[${escapeStringRegexp(alphabet)}]{${size}}$`, "g");

export const extractId = (text: string) => {
  const match = text.match(pattern);
  if (match) {
    return {
      id: match[0].slice(1),
      content: text.slice(0, -match[0].length),
    };
  }
  return null;
};
export const buildId = (text: string, id?: string) =>
  `${text}#${id ?? nanoid()}`;
