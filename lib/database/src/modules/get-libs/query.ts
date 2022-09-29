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

const sql = (knex: Knex) =>
  knex
    .select("libraryID", "type", "groupID")
    .from("libraries")
    .leftJoin("groups", (j) => j.using("libraryID"))
    .orderBy("libraryID");

export default sql;
