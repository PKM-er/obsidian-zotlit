// SELECT
//   itemID,
//   firstName,
//   lastName,
//   fieldMode, -- 0: with full name, 1: only last name
//   creatorType,
//   orderIndex
// FROM
//   items
//   LEFT JOIN itemCreators USING (itemID)
//   JOIN creators USING (creatorID)
//   JOIN creatorTypes USING (creatorTypeID)
// WHERE
//   libraryID = ?
// ORDER BY
//   itemID,
//   orderIndex

// select `itemID`, `firstName`, `lastName`, `fieldMode`, `creatorType`, `orderIndex` from `items` inner join `creators` using (`creatorID`) inner join `creatorTypes` using (`creatorTypeID`) where `libraryID` = 1 order by `itemID` asc

import { Knex } from "../db/knex.config";

const creatorSql = (knex: Knex, libId: number) =>
  knex
    .select(
      "itemID",
      "firstName",
      "lastName",
      "fieldMode",
      "creatorType",
      "orderIndex",
    )
    .from("items")
    .leftJoin("itemCreators", function () {
      this.using("itemID");
    })
    .join("creators", function () {
      this.using("creatorID");
    })
    .join("creatorTypes", function () {
      this.using("creatorTypeID");
    })
    .where("libraryID", libId)
    .orderBy("itemID", "orderIndex");

export default creatorSql;
