import Database from "@aidenlx/better-sqlite3";
import dedent from "endent";
import { promises as fs } from "fs";
import { homedir } from "os";
import path from "path";
import prettier from "prettier";

const root = path.join(process.cwd(), "src", "zotero-types");
try {
  await fs.mkdir(root);
} catch (err) {
  if (err.code !== "EEXIST") throw err;
}
const writeTo = (filename, content) =>
  fs.writeFile(
    path.join(root, filename),
    prettier.format(content, { parser: "typescript" }),
  );

const capitalize1stLetter = (string) =>
    string.charAt(0).toUpperCase() + string.slice(1),
  fieldsToTypeUnion = (fields) => fields.map((t) => `"${t}"`).join(" | "),
  itemTypeToTSTypeName = (type) => `${capitalize1stLetter(type)}Item`;
const nonRegularItemTypes = ["annotation", "attachment", "note"];
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

const db = new Database(path.join(homedir(), "Zotero/zotero.sqlite"));

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

let regular = dedent`
import { RegularItemBase } from "./item-base";
`,
  nonRegular = dedent`
  import { ItemBase } from "./item-base";
  `;

let regularTypes = [],
  nonRegularTypes = [],
  regularItemUnion = [];
for (const type in ItemTypeFieldsMap) {
  const typeName = itemTypeToTSTypeName(type);
  const render = (baseType) => dedent`
  export type ${typeName} =
    ${baseType} & Record<"itemType", "${type}"> 
    ${generateRecordForFields(ItemTypeFieldsMap[type])};
`;
  if (nonRegularItemTypes.includes(type)) {
    nonRegularTypes.push(render("ItemBase"));
  } else {
    regularItemUnion.push(typeName);
    regularTypes.push(render("RegularItemBase"));
  }
}
regular += dedent`
  export type RegularItem = ${regularItemUnion.join(" | ")};
  ${regularTypes.join("\n")}
`;
nonRegular += nonRegularTypes.join("\n");
writeTo("regular.d.ts", regular);
writeTo("non-regular.d.ts", nonRegular);

let fieldsOut = dedent`
export type ItemField = ${fieldsToTypeUnion(fields)};
export type ItemType = ${fieldsToTypeUnion(Object.keys(ItemTypeFieldsMap))};
export const AllFields = ${json};
export const AllTypes = ${JSON.stringify(Object.keys(ItemTypeFieldsMap))};
`;
writeTo("fields.ts", fieldsOut);
