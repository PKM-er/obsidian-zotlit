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

import { Knex } from "../db/knex.config";

const betterBibTexSql = (knex: Knex) =>
  knex
    .select(
      "libraryID",
      knex.raw("CASE type WHEN 'user' THEN 'My Library' ELSE name END AS name"),
    )
    .from("libraries")
    .leftJoin("groups", function () {
      this.using("libraryID");
    })
    .orderBy("libraryID");
export default betterBibTexSql;
