import log from "@log";

import libsSql from "./libraries.sql";

export const registerGetLibs = () => {
  Comms.handle("cb:getLibs", async () => {
    if (!Databases.main) {
      const error = "failed to init index: database not initialized";
      log.error(error);
      return error;
    }
    log.info("Reading Zotero database for libraries");
    const mainDb = await Databases.main.open();
    const libs: { libraryID: number; name: string }[] = await mainDb.read(
      (db) => db.prepare(libsSql).all(),
    );
    log.info("Reading Zotero database for libraries done");

    return [[libs]];
  });
};
