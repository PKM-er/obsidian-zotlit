export const libName = "better-sqlite3.node",
  loggerCategory = <C extends string>(category: C) =>
    `obsidian-zotero:${category}` as const;
