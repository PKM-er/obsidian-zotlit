import log from "@log";

import libsSql from "./libraries";

export const registerGetLibs = () => {
  Comms.handle("cb:getLibs", async () => {
    const db = Databases.main.db;
    if (!db) {
      throw new Error("failed to get libs: no main database opened");
    }
    log.info("Reading Zotero database for libraries");
    const libs: { libraryID: number; name: string }[] = await libsSql(db);
    log.info("Reading Zotero database for libraries done");
    return [[libs]];
  });
};
