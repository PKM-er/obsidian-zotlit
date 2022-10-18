export const loggerCategory = <C extends string>(category: C) =>
  `obsidian-zotero:${category}` as const;
