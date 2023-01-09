import { getBanner, knex } from "./knex.mjs";
import endent from "endent";
import { promises as fs } from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const scriptDir = dirname(fileURLToPath(import.meta.url)),
  srcDir = path.join(scriptDir, "..", "src");

// helper functions
const writeTo = (filename, content) =>
  fs.writeFile(path.join(srcDir, filename), getBanner("field-type") + content);
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
    .orderBy("typeName")
).map(({ typeName, fieldsJSON }) => ({
  typeName,
  fields: JSON.parse(fieldsJSON).sort(),
}));

const fields = (await knex.select("fieldName").from("fields")).map(
  ({ fieldName }) => fieldName,
);

let regular = ``,
  nonRegular = ``;
let regularTypeDefs = [],
  nonRegularTypeDefs = [],
  regularItemTypes = [];

for (const { typeName: type, fields } of itemTypeFieldsMap) {
  const typeName = itemTypeToTSTypeName(type);
  const render = () => endent.default`
    export type ${typeName}<Base> =
      Base & Record<"itemType", "${type}"> 
      ${generateRecordForFields(fields)};
  `;
  if (nonRegularItemTypes.includes(type)) {
    nonRegularTypeDefs.push(render());
  } else {
    regularItemTypes.push(typeName);
    regularTypeDefs.push(render());
  }
}
regular += endent.default`
    export type RegularItem<Base> = ${regularItemTypes
      .map((t) => `${t}<Base>`)
      .join(" | ")};
    ${regularTypeDefs.join("\n")}
  `;
nonRegular += nonRegularTypeDefs.join("\n");
nonRegular += `
export const nonRegularItemTypes = ["attachment", "note", "annotation"] as const;
`;
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
