/* eslint-disable @typescript-eslint/naming-convention */
import { join } from "path/posix";
import annotation from "../defaults/zt-annot.ejs";
import annots from "../defaults/zt-annots.ejs";
import field from "../defaults/zt-field.ejs";
import note from "../defaults/zt-note.ejs";

export const Template = {
  Ejectable: {
    note,
    field,
    annots,
    annotation,
  },
  Embeded: {
    filename: "<%= it.citekey ?? it.DOI ?? it.title ?? it.key %>.md",
    citation: "[@<%= it.citekey %>]",
    altCitation: "@<%= it.citekey %>",
  },
} as const;

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace TplType {
  export type Ejectable = keyof typeof Template.Ejectable;
  export type Embeded = keyof typeof Template.Embeded;
  export type All = Ejectable | Embeded;
}

export const TemplateNames = {
  Ejectable: Object.keys(Template.Ejectable) as TplType.Ejectable[],
  Embeded: Object.keys(Template.Embeded) as TplType.Embeded[],
  All: Object.keys(Template.Ejectable).concat(
    Object.keys(Template.Embeded),
  ) as TplType.All[],
} satisfies Record<keyof typeof Template | "All", string[]>;

export function toFilename(type: TplType.All): string;
export function toFilename(type: string): string | null;
export function toFilename(type: string) {
  if (Object.hasOwn(Template.Embeded, type)) {
    return `zt-${type}.eta.md`;
  }
  if (Object.hasOwn(Template.Ejectable, type)) {
    return type === "annotation" ? "zt-annot.eta.md" : `zt-${type}.eta.md`;
  }
  return null;
}

export function toPath(type: TplType.Ejectable, templateDir: string) {
  return join(templateDir, toFilename(type));
}
export function fromPath(filepath: string, templateDir: string) {
  const embeded = TemplateNames.Embeded.find(
    (name) => join(templateDir, `zt-${name}.eta.md`) === filepath,
  );
  if (embeded)
    return {
      type: "embeded" as const,
      name: embeded,
    };
  const ejectable = TemplateNames.Ejectable.find(
    (name) => toPath(name, templateDir) === filepath,
  );
  if (ejectable) {
    return {
      type: "ejectable" as const,
      name: ejectable,
    };
  }
  return null;
}
