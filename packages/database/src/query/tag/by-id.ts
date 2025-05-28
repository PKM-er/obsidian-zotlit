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

export async function getTagsById({ tags }: { tags: { tagId: number }[] }) {
  return new Map(
    (
      await Promise.all(
        tags.map(async (tag) => {
          const [value] = await statement.get(
            v.parse(ParamsSchema, { tagId: tag.tagId }),
          );
          return value ? ([tag.tagId, parseTag(value)] as const) : null;
        }),
      )
    ).filter((v) => !!v),
  );
}
