import dedent from "dedent";

const filename =
  "/Users/aidenlx/Library/Application Support/Zotero/Profiles/0mfu0e9q.ZoteroDEBUG/zotero/zotero.sqlite";
const generalFieldsSql = dedent`
WITH vals AS (
  SELECT
    itemID,
    fieldID,
    value
  FROM
    items
    JOIN itemData USING (itemID)
    JOIN itemDataValues USING (valueID)
  WHERE
    libraryID = ?
    AND itemTypeID NOT IN (1, 3, 27) -- annotation, attachment, note
    AND itemID NOT IN (
      SELECT
        itemID
      FROM
        deletedItems
    )
)
SELECT
  itemID,
  fieldID,
  value
FROM
  vals
`;
const creatorFieldsSql = dedent`
SELECT
  itemID,
  firstName,
  lastName,
  fieldMode,
  creatorTypeID,
  orderIndex
FROM
  items
  LEFT JOIN itemCreators USING (itemID)
  INNER JOIN creators USING (creatorID)
WHERE
  libraryID = ?
ORDER BY
  itemID,
  orderIndex
`;

import Database from "@aidenlx/better-sqlite3";

const db = new Database(filename);

let start = process.hrtime();

const elapsed_time = (note) => {
  var precision = 3; // 3 decimal places
  var elapsed = process.hrtime(start)[1] / 1000000; // divide by a million to get nano to milli
  console.log(
    process.hrtime(start)[0] +
      " s, " +
      elapsed.toFixed(precision) +
      " ms - " +
      note,
  ); // print message + time
  start = process.hrtime(); // reset the timer
};

elapsed_time("start read general");
const general = db.prepare(generalFieldsSql).all(2);
elapsed_time("end read general");

elapsed_time("start read creator");
const creators = db.prepare(creatorFieldsSql).all(2);
elapsed_time("end read creator");

import Fuse from "fuse.js";

elapsed_time("start convert");
let entries = new Map();
for (const { itemID, fieldID, value } of general) {
  if (entries.has(itemID)) {
    entries.get(itemID)[fieldID] = value;
  } else {
    entries.set(itemID, { itemID, [fieldID]: value, creators: [] });
  }
}
for (const { itemID, ...creator } of creators) {
  entries.get(itemID)?.creators.push(creator);
}
entries = Array.from(entries.values());
elapsed_time("end convert");

const options = { keys: ["1", "2"] };

// Create the Fuse index
elapsed_time("start indexing");
const index = Fuse.createIndex(options.keys, entries);
elapsed_time("end indexing");

elapsed_time("start init");
const fuse = new Fuse(entries, options, index);
elapsed_time("end init");

elapsed_time("start search");
console.log(fuse.search("war"));
elapsed_time("end search");
