/* eslint-disable @typescript-eslint/naming-convention */
import { writeFile } from "fs/promises";
import { dirname, join } from "path";
import sqlts from "@rmp135/sql-ts";
import endent from "endent";
import { fileURLToPath } from "url";
import { knex, getBanner } from "./knex.mjs";

const config = {
  interfaceNameFormat: "${table}",
  tableNameCasing: "pascal",
  typeMap: {
    string: ["timestamp"],
  },
  typeOverrides: {
    "main.deletedCollections.dateDeleted": "string",
    "main.deletedItems.dateDeleted": "string",
    "main.deletedSearches.dateDeleted": "string",
    "main.itemData.valueID": "number",
    "main.itemDataValues.value": "unknown",
    "main.syncedSettings.value": "unknown",
    "main.settings.value": "unknown",
    "main.savedSearchConditions.required": "unknown",
    "main.libraries.type": "LibraryType",
    "main.itemAnnotations.type": "AnnotationType",
    "main.itemAnnotations.isExternal": "BooleanInt",
    "main.itemTags.type": "TagType",
    "main.itemAttachments.linkMode": "AttachmentType",
  },
  excludedTables: ["main.dbDebug1"],
  // globalOptionality: "required",
};
const definitions = await sqlts.toObject(config, knex);
knex.destroy();
let tsString = sqlts.fromObject(definitions, config);
tsString = endent.default`
    import type { AnnotationType, TagType, BooleanInt, LibraryType, AttachmentType } from "./misc.js";
    ${tsString}
  `;
const __dirname = dirname(fileURLToPath(import.meta.url));
writeFile(join(__dirname, "..", "src/db-types.ts"), tsString);
writeFile(
  join(__dirname, "..", "src/knex.d.ts"),
  getBanner("db-type") +
    endent.default`
      import type * as DB from "./db-types.js";
      declare module "@aidenlx/knex/types/tables" {
        interface Tables {
          ${definitions.tables
            .map(
              ({ name, interfaceName }) =>
                `${name}: Required<DB.${interfaceName}>;`,
            )
            .join("\n")}
        }
      }
  `,
);
