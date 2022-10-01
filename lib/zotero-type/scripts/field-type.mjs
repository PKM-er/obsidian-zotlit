import { getBanner, knex } from "./knex.mjs";
import endent from "endent";
import { promises as fs } from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "src");

// helper functions
const writeTo = (filename, content) =>
  fs.writeFile(path.join(root, filename), getBanner("field-type") + content);
const capitalize1stLetter = (string) =>
    string.charAt(0).toUpperCase() + string.slice(1),
  fieldsToTypeUnion = (fields) => fields.map((t) => `"${t}"`).join(" | "),
  itemTypeToTSTypeName = (type) => `${capitalize1stLetter(type)}Item`;
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

// constants

const nonRegularItemTypes = ["annotation", "attachment", "note"];
const dateFields = ["accessDate"];

const itemTypeFieldsMap = (
  await knex
    .with(
      "typeFieldnames",
      knex
        .select("itemTypeID", "fieldName")
        .from("itemTypeFields")
        .join("fields", (j) => j.using("fieldID")),
    )
    .select(
      "typeName",
      knex.raw(
        "replace(json_group_array(typeFieldnames.fieldName), '[null]', '[]') AS fieldsJSON",
      ),
    )
    .from("itemTypes")
    .leftJoin("typeFieldnames", (j) => j.using("itemTypeID"))
    // .whereNotIn("typeName", nonRegularItemTypes)
    .groupBy("itemTypeID")
).map(({ typeName, fieldsJSON }) => ({
  typeName,
  fields: JSON.parse(fieldsJSON),
}));

const fields = (await knex.select("fieldName").from("fields")).map(
  ({ fieldName }) => fieldName,
);

let regular = `import { GeneralItem } from "./item";`,
  nonRegular = `import { Item } from "./item";`;
let regularTypes = [],
  nonRegularTypes = [],
  regularItemUnion = [];

for (const { typeName: type, fields } of itemTypeFieldsMap) {
  const typeName = itemTypeToTSTypeName(type);
  const render = (baseType) => endent.default`
    export type ${typeName} =
      ${baseType} & Record<"itemType", "${type}"> 
      ${generateRecordForFields(fields)};
  `;
  if (nonRegularItemTypes.includes(type)) {
    nonRegularTypes.push(render("Item"));
  } else {
    regularItemUnion.push(typeName);
    regularTypes.push(render("GeneralItem"));
  }
}
regular += endent.default`
    export type RegularItem = ${regularItemUnion.join(" | ")};
    ${regularTypes.join("\n")}
  `;
nonRegular += nonRegularTypes.join("\n");
await writeTo("regular.ts", regular);
await writeTo("non-regular.ts", nonRegular);

const types = itemTypeFieldsMap.map(({ typeName }) => typeName);
const fieldsMap = itemTypeFieldsMap.reduce(
  (acc, { typeName, fields }) => ((acc[typeName] = fields), acc),
  {},
);
let fieldsOut = endent.default`
  export type ItemFields = ${fieldsToTypeUnion(fields)};
  export type ItemTypes = ${fieldsToTypeUnion(types)};
  `;
await writeTo("fields.ts", fieldsOut);

let fieldsExtraOut = endent.default`
  export const allFields = ${JSON.stringify(fieldsMap)};
  export const allTypes = ${JSON.stringify(types)};
  // From Zotero.ItemTypes
  const primaryTypeNames = [
    "book",
    "bookSection",
    "journalArticle",
    "newspaperArticle",
    "document",
  ] as const;
  
  export const primaryTypeFields = primaryTypeNames.reduce(
    (map, type) => ((map[type] = allFields[type]), map),
    {} as Pick<typeof allFields, typeof primaryTypeNames[number]>,
  );
  `;
await writeTo("fields.extra.ts", fieldsExtraOut);

knex.destroy();
