import * as v from "valibot";

const annotationPositionSchema = v.object({
  pageIndex: v.number(),
  rects: v.array(v.tuple([v.number(), v.number(), v.number(), v.number()])),
});

export type AnnotationPosition = v.InferOutput<typeof annotationPositionSchema>;

const annotationPositionFieldSchema = v.pipe(
  v.string(),
  v.parseJson(),
  annotationPositionSchema,
);

export function parseAnnotationPosition(
  value: unknown,
  ctx: () => Record<string, unknown>,
): AnnotationPosition | null {
  const result = v.safeParse(annotationPositionFieldSchema, value);
  if (result.success) {
    return result.output;
  }
  console.warn("Failed to parse annotation position", value, ctx());
  return null;
}
