import Database from "better-sqlite3";
import dedent from "dedent";
import { promises as fs } from "fs";
import { homedir } from "os";
import path from "path";
import prettier from "prettier";

import * as config from "../.prettierrc.js";

const capitalize1stLetter = (string) =>
    string.charAt(0).toUpperCase() + string.slice(1),
  fieldsToTypeUnion = (fields) => fields.map((t) => `"${t}"`).join(" | "),
  itemTypeToTSTypeName = (type) => `${capitalize1stLetter(type)}Item`;
const nonRegularItemTypes = ["annotation", "attachment", "note"];

const filename = path.join(homedir(), "Zotero/zotero.sqlite");

const db = new Database(filename);

const { json } = db
    .prepare(
      dedent`
    SELECT
      replace(
        json_group_object(typeName, fieldsJSON),
        '[null]',
        '[]'
      ) json
    FROM
      (
        SELECT
          t.typeName,
          json_group_array(tfn.fieldName) fieldsJSON
        FROM
          itemTypes t -- types
          LEFT JOIN (
            SELECT
              tf.itemTypeID,
              f.fieldName
            FROM
              itemTypeFields tf -- type fields
              INNER JOIN fields f USING (fieldID)
          ) tfn -- type-fieldnames
          USING (itemTypeID)
        GROUP BY
          t.itemTypeID
      )
`,
    )
    .all()[0],
  ItemTypeFieldsMap = JSON.parse(json);
const fields = db
  .prepare("SELECT fieldName FROM fields")
  .all()
  .map(({ fieldName }) => fieldName);

const dateFields = ["accessDate"];
const generateRecordForFields = (fields) => {
  let output = "";
  if (fields.length === 0) {
    return ";";
  }
  const date = fields.filter((f) => dateFields.includes(f)),
    str = fields.filter((f) => !dateFields.includes(f));
  output += `& Partial<`;
  output += `Record<${fieldsToTypeUnion(str)}, string >`;
  if (date.length > 0) output += `& Record<${fieldsToTypeUnion(date)}, Date >`;
  output += ">;";
  return output;
};

let typeDef = dedent`
import { ItemBase } from "./item-base";

export type ItemType = ${fieldsToTypeUnion(Object.keys(ItemTypeFieldsMap))};
export type ItemFields = ${fieldsToTypeUnion(fields)};

export type RegularItem = ${Object.keys(ItemTypeFieldsMap)
  .filter((type) => !nonRegularItemTypes.includes(type))
  .map(itemTypeToTSTypeName)
  .join(" | ")};
`;

for (const type in ItemTypeFieldsMap) {
  typeDef += dedent`
  export type ${itemTypeToTSTypeName(type)} =
    ItemBase & Record<"itemType", "${type}"> 
    ${generateRecordForFields(ItemTypeFieldsMap[type])};
    \n
`;
}

const writeTo = path.join(process.cwd(), "src", "zotero-types", "fields.ts");
try {
  await fs.mkdir(path.dirname(writeTo));
} catch (err) {
  if (err.code !== "EEXIST") throw err;
}

await fs.writeFile(
  writeTo,
  prettier.format(
    dedent`
    ${typeDef}

    export const Fields = ${json};
    export const ItemTypes = ${JSON.stringify(Object.keys(ItemTypeFieldsMap))};
`,
    { ...config, parser: "typescript" },
  ),
);
