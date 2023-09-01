import type { TplType } from "@/services/template/eta/preset";

export const templateDesc: Record<
  TplType.All,
  { title: string; desc: DocumentFragment | string }
> = {
  filename: { title: "Note Filename", desc: "" },
  citation: { title: "Markdown primary citation template", desc: "" },
  altCitation: { title: "Markdown secondary citation template", desc: "" },
  field: {
    title: "Note Properties",
    desc: "Used to render Properties in literature note",
  },
  note: {
    title: "Note Content",
    desc: "Used to render created literature note",
  },
  annotation: {
    title: "Annotaion",
    desc: "Used to render single annotation",
  },
  annots: {
    title: "Annotations",
    desc: "Used to render annotation list when batch importing",
  },
};
