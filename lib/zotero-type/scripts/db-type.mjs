/* eslint-disable @typescript-eslint/naming-convention */
import { writeFile } from "fs/promises";
import { dirname, join, resolve } from "path";
import sqlts from "@rmp135/sql-ts";
import { fileURLToPath } from "url";
import { getBanner } from "./knex.mjs";

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
    "main.creators.fieldMode": "CreatorFieldMode",
  },
  excludedTables: ["main.dbDebug1"],
  globalOptionality: "required",
  client: "better-sqlite3",
  connection: {
    filename: resolve("/Users/aidenlx/Zotero/zotero.sqlite"),
    readonly: true,
  },
  useNullAsDefault: true,
  // debug: true,
  pool: { min: 1, max: 1 },
};

const scriptDir = dirname(fileURLToPath(import.meta.url)),
  srcDir = join(scriptDir, "..", "src");

await writeFile(
  join(srcDir, "db-types.ts"),
  `
${getBanner("db-type")}
import type { AnnotationType, TagType, BooleanInt, LibraryType, AttachmentType, CreatorFieldMode } from "./misc.js";
${await sqlts.toTypeScript(config)}
`,
);
