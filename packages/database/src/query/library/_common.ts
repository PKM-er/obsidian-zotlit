import * as v from "valibot";

const LibraryTypeSchema = v.picklist(["user", "group"]);

export const LibrarySchema = v.pipe(
  v.object({
    libraryId: v.number(),
    type: LibraryTypeSchema,
    groupName: v.nullable(v.string()),
    groupId: v.nullable(v.number()),
  }),
  v.transform((v) => ({
    ...v,
    name: v.type === "user" ? "My Library" : v.groupName,
  })),
);

export type LibraryType = v.InferOutput<typeof LibraryTypeSchema>;
export type Library = v.InferOutput<typeof LibrarySchema>;
