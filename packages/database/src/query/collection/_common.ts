import queryCollectionPath from "./with-path";
import { collections } from "@zt/schema";

export async function resolveCollectionPath<T extends { id: number }>(
  rows: T[],
) {
  const pathResult = await queryCollectionPath(rows);
  return rows.map((row) => ({
    path: pathResult.get(row.id) ?? [],
    ...row,
  }));
}
export const collectionColumns = {
  id: collections.collectionId,
  name: collections.collectionName,
  key: collections.key,
  libraryId: collections.libraryId,
};
