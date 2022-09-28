// SELECT
//   libraryID,
//   CASE
//     type
//     WHEN 'user' THEN 'My Library'
//     ELSE name
//   END name
// FROM
//   libraries
//   LEFT JOIN groups USING (libraryID)
//   ORDER BY libraryID

import type { Knex } from "@knex";

declare module "@aidenlx/knex/types/tables" {
  interface Library {
    libraryID: number;
    type: "user" | "group";
    editable: number;
    filesEditable: number;
    version: number;
    storageVersion: number;
    lastSync: number;
    archived: number;
  }

  interface Group {
    groupID: number;
    libraryID: number;
    name: string;
    description: string;
    version: number;
  }

  interface Tables {
    libraries: Library;
    groups: Group;
  }
}

const betterBibTexSql = (knex: Knex) =>
  knex
    .select("libraryID", "type", "groupID")
    .from("libraries")
    .leftJoin("groups", (j) => j.using("libraryID"))
    .orderBy("libraryID");

export default betterBibTexSql;
