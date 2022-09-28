import type { Library } from "@aidenlx/knex/types/tables";
import type { AnnotationType } from "@obzt/zotero-type";
import type { Knex } from "@knex";
declare module "@aidenlx/knex/types/tables" {
  interface Annotation {
    itemID: number;
    parentItemID: number;
    type: AnnotationType;
    authorName: string | null;
    text: string | null;
    comment: string | null;
    color: string;
    pageLabel: string;
    /**
     * @example '00002|003495|00109'
     */
    sortIndex: string;
    /**
     * json
     * @example '{"pageIndex":2,"rects":[[302.942,504.904,561.092,684.076]]}'
     */
    position: string;
    isExternal: 0 | 1;
  }

  interface Tables {
    itemAnnotations: Annotation;
  }
  type QAnnoResult = Annotation & Item & Group & Library;
}

const queryAnnotations = (knex: Knex, attachmentId: number, libId: number) =>
  knex
    .select(
      "itemID",
      "key",
      "libraryID",
      "groupID",
      "itemAnnotations.type" as "type",
      "authorName",
      "text",
      "comment",
      "color",
      "pageLabel",
      "sortIndex",
      "position",
    )
    .from("itemAnnotations")
    .join("items", (j) => j.using("itemID"))
    .join<Omit<Library, "type">>("libraries", (j) => j.using("libraryID"))
    .leftJoin("groups", (j) => j.using("libraryID"))
    .where("parentItemID", attachmentId)
    .andWhere("libraryID", libId);

export default queryAnnotations;
