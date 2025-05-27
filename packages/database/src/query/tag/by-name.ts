import { tags } from "@zt/schema";
import { prepareTagQuery } from "./_sql";
import * as v from "valibot";
import { sql } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { distinct } from "@std/collections";
import { parseTag } from "./_parse";

const ParamsSchema = v.object({
  name: v.pipe(v.string(), v.trim(), v.toLowerCase()),
});

const statement = prepareTagQuery({
  where: eq(sql`lower(${tags.name})`, sql.placeholder("name")),
});

export function getTagsByName({ tags }: { tags: { name: string }[] }) {
  const tagNamesLower = distinct(tags.map((t) => t.name.toLowerCase()));
  return new Map(
    tagNamesLower
      .map((name) => {
        const result = statement.all(v.parse(ParamsSchema, { name }));
        if (result.length === 0) return null;
        return [name, result.map(parseTag)] as const;
      })
      .filter((v) => !!v),
  );
}
