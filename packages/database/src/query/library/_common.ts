export function resolveName<
  T extends { type: string; groupName: string | null },
>(row: T) {
  return {
    ...row,
    name:
      row.type === "user"
        ? "My Library"
        : row.type === "group"
          ? row.groupName
          : null,
  };
}
