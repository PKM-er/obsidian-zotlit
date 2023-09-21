import type { TplType } from "@/services/template/eta/preset";

export const templateDesc: Record<
  TplType.All,
  { title: string; desc: DocumentFragment | string }
> = {
  filename: {
    title: "Note filename",
    desc: "Used to render filename for each imported literature note",
  },
  cite: {
    title: "Primary Markdown citation",
    desc: "Used to render citation in literature note",
  },
  cite2: {
    title: "Secondary Markdown citation",
    desc: "Used to render alternative citation in literature note",
  },
  field: {
    title: "Note properties",
    desc: "Used to render Properties in literature note",
  },
  note: {
    title: "Note content",
    desc: "Used to render created literature note",
  },
  annotation: {
    title: "Single annotaion",
    desc: "Used to render single annotation",
  },
  annots: {
    title: "Annotations",
    desc: "Used to render annotation list when batch importing",
  },
  colored: {
    title: "Colored highlight",
    desc: "Used to render highlights with color in imported Zotero note",
  },
};
