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

import type { Knex } from "@knex";

declare module "@aidenlx/knex/types/tables" {
  interface Item {
    itemID: number;
    itemTypeID: number;
    dateAdded: string;
    dateModified: string;
    clientDateModified: string;
    libraryID: number;
    key: string;
    version: number;
    synced: number;
  }

  interface ItemCreator {
    itemID: number;
    creatorID: number;
    creatorTypeID: number;
    orderIndex: number;
  }
  interface Creator {
    creatorID: number;
    firstName: string;
    lastName: string;
    /**
     * 0: with full name, 1: only last name
     */
    fieldMode: 0 | 1;
  }

  interface CreatorType {
    creatorTypeID: number;
    creatorType: string;
  }

  interface Tables {
    items: Item;
    itemCreators: ItemCreator;
    creators: Creator;
    creatorTypes: CreatorType;
  }
}

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
    .leftJoin("itemCreators", (j) => j.using("itemID"))
    .join("creators", (j) => j.using("creatorID"))
    .join("creatorTypes", (j) => j.using("creatorTypeID"))
    .where("libraryID", libId)
    .orderBy("itemID", "orderIndex");

export default creatorSql;
