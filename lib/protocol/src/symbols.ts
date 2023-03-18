export const mergeAnnotationPattern = /^<!--merge:(\d+)-->/;

export function toMergedAnnotation(
  comment: string | null,
  mainId: number,
  isMain: boolean,
) {
  const prefix = `<!--merge:${mainId}-->`;
  return (
    (!isMain ? prefix : "") +
    (comment?.replace(mergeAnnotationPattern, "") ?? "")
  );
}
