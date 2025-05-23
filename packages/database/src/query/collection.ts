import { db } from "@/db";
import { collections } from "@zt/schema";
import { and, eq, inArray, type SQL } from "drizzle-orm";
import { queryCollectionPath } from "./_collection-path";

async function query({ where: whereClause }: { where: SQL | undefined }) {
  const result = await db("zt")
    .select({
      id: collections.collectionId,
      name: collections.collectionName,
      key: collections.key,
      libraryId: collections.libraryId,
    })
    .from(collections)
    .where(whereClause);
  const pathResult = queryCollectionPath({
    where: (table) =>
      inArray(
        table.collectionId,
        result.map(({ id }) => id),
      ),
  });
  return result.map(({ id, ...rest }) => ({
    path: pathResult.get(id) ?? [],
    id,
    ...rest,
  }));
}

export async function getAllCollections({
  libraryId,
}: {
  libraryId: number;
}) {
  return await query({
    where: eq(collections.libraryId, libraryId),
  });
}

export async function getCollectionsById({
  collections: inputs,
  libraryId,
}: {
  collections: { collectionId: number }[];
  libraryId: number;
}) {
  return await query({
    where: and(
      eq(collections.libraryId, libraryId),
      inArray(
        collections.collectionId,
        inputs.map(({ collectionId }) => collectionId),
      ),
    ),
  });
}

export async function getCollectionsByKey({
  collections: inputs,
  libraryId,
}: {
  collections: { key: string }[];
  libraryId: number;
}) {
  return await query({
    where: and(
      eq(collections.libraryId, libraryId),
      inArray(
        collections.key,
        inputs.map(({ key }) => key),
      ),
    ),
  });
}
