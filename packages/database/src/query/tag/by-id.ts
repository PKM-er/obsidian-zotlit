import * as v from "valibot";
import { prepareTagQuery } from "./_sql";
import { sql } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { tags } from "@zt/schema";
import { parseTag } from "./_parse";

const ParamsSchema = v.object({
  tagId: v.number(),
});

const statement = prepareTagQuery({
  where: eq(tags.tagId, sql.placeholder("tagId")),
});

export function getTagsById({ tags }: { tags: { tagId: number }[] }) {
  return new Map(
    tags
      .map((tag) =>
        statement.all(v.parse(ParamsSchema, { tagId: tag.tagId })).at(0),
      )
      .filter((v) => !!v)
      .map((v) => [v.tagId, parseTag(v)]),
  );
}
