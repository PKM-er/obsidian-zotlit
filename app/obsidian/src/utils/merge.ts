import { groupBy } from "@mobily/ts-belt/Array";
import { toMutable } from "@mobily/ts-belt/Function";
import type { AnnotationInfo, TagInfo } from "@obzt/database";
import { sortBySortIndex } from "@obzt/database";
import { mergeAnnotationPattern } from "@obzt/protocol";

export function mergeAnnots(annotations: AnnotationInfo[]): AnnotationInfo[][] {
  const groups = groupBy(
    annotations,
    (annot) => annot.comment?.match(mergeAnnotationPattern)?.[1] ?? -1,
  );
  const notMerged = groups[-1] ?? [];
  const output = new Map(notMerged.map((annot) => [annot.itemID, [annot]]));
  delete groups[-1];
  for (const [mergeTargetId, annots] of Object.entries(groups)) {
    const targetArray = output.get(+mergeTargetId);
    annots.forEach((a) => {
      a.comment &&= a.comment.replace(mergeAnnotationPattern, "") ?? null;
    });
    if (targetArray) {
      targetArray.push(
        ...toMutable(annots).sort((a, b) =>
          sortBySortIndex(a.sortIndex, b.sortIndex),
        ),
      );
    } else {
      annots.forEach((a) => {
        output.set(a.itemID, [a]);
      });
    }
  }
  for (const [target, ...annots] of output.values()) {
    if (annots.length <= 0) continue;
    for (const a of annots) {
      if (a.comment) {
        target.comment = (target.comment ?? "") + "\n" + a.comment;
      }
      if (a.text) {
        if (!target.text) {
          target.text = a.text;
        } else if (target.text.endsWith("-") && !target.text.endsWith("--")) {
          target.text.substring(0, target.text.length - 1) + a.text.trimStart();
        } // if the target text ends with english word, add a space
        else if (
          target.text.match(/[a-zA-Z\d]\s*$/) &&
          a.text.match(/^\s*[a-zA-Z\d]/)
        ) {
          target.text = target.text.trimEnd() + " " + a.text.trimStart();
        } else {
          target.text = target.text.trimEnd() + a.text.trimStart();
        }
      }
    }
    target.comment =
      target.comment?.replace(/\n+/, "\n").replace(/^\s+|\s+$/g, "") ?? null;
  }
  return [...output.values()];
}

export function mergedToAnnots(mergedAnnots: AnnotationInfo[][]) {
  return mergedAnnots.map((arr) => arr[0]);
}

export function mergeTags(
  mergedAnnots: AnnotationInfo[][],
  tags: Record<number, TagInfo[]>,
) {
  const mergedTags = mergedAnnots.map(([target, ...annots]) => {
    if (annots.length === 0)
      return [target.itemID, tags[target.itemID]] as const;
    const mergedTags = new Map(tags[target.itemID].map((t) => [t.tagID, t]));
    annots.forEach((a) => {
      tags[a.itemID].forEach((t) => {
        mergedTags.set(t.tagID, t);
      });
    });
    return [target.itemID, Array.from(mergedTags.values())] as const;
  });
  return Object.fromEntries(mergedTags);
}

export function merge(
  annotations: AnnotationInfo[],
  tags: Record<number, TagInfo[]>,
) {
  const mergedAnnots = mergeAnnots(annotations);
  return {
    annotations: mergedToAnnots(mergedAnnots),
    tags: mergeTags(mergedAnnots, tags),
  };
}
