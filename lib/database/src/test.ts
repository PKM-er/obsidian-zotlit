import { join } from "path";
import makeKnex from "@aidenlx/knex";

(async () => {
  const knex = makeKnex({
    client: "better-sqlite3",
    connection: {
      filename: `file:${"/Users/aidenlx/Zotero/zotero.sqlite"}?mode=ro&immutable=1`,
      nativeBinding: join(
        require.resolve("@aidenlx/better-sqlite3"),
        "../../build/Release/better_sqlite3.node",
      ),
      readonly: true,
    },
    useNullAsDefault: true,
    debug: true,
    pool: { min: 1, max: 1 },
  });
  const item = 4;
  const result = await knex
    .select(
      "itemID",
      "key",
      "libraryID",
      "groupID",
      "itemAnnotations.type",
      "authorName",
      "text",
      "comment",
      "color",
      "pageLabel",
      "sortIndex",
      "position",
    )
    .from("itemAnnotations")
    .leftJoin("items", (j) => j.using("itemID"))
    .leftJoin("libraries", (j) => j.using("libraryID"))
    .leftJoin("groups", (j) => j.using("libraryID"))
    .where("parentItemID", 3);
  console.log(result);
  knex.destroy();
})();
