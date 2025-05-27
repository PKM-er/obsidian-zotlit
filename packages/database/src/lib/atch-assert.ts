import type { ItemQueryAttachment } from "@/query/item/_parse";

const annotatable = new Set([
  "application/pdf",
  "text/html",
  "application/epub+zip",
]);

export const isFileAttachment = (i: ItemQueryAttachment): boolean =>
  Boolean(i.path);
export const isAnnotatableAttachment = (i: ItemQueryAttachment): boolean =>
  isFileAttachment(i) && !!i.contentType && annotatable.has(i.contentType);
