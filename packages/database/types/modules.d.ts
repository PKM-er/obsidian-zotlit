declare module "@db/zotero" {
  import type { ZoteroSchema } from "@/db/schema/zotero";
  import type { BrowserDrizzleDatabase } from "@/db/manager/browser";
  import type { NodeDrizzleDatabase } from "@/db/manager/node";

  export const db: // use browser variant to avoid type errors
  // | NodeDrizzleDatabase<ZoteroSchema>
  BrowserDrizzleDatabase<ZoteroSchema>;
}

declare module "@db/bbt" {
  import type { BetterBibtexSchema } from "@/db/schema/bbt";
  import type { BrowserDrizzleDatabase } from "@/db/manager/browser";
  import type { NodeDrizzleDatabase } from "@/db/manager/node";

  export const db: // | NodeDrizzleDatabase<BetterBibtexSchema>
  BrowserDrizzleDatabase<BetterBibtexSchema>;
}
