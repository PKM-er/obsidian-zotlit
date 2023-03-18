import type { AnnotationInfo, TagInfo } from "@obzt/database";
import { useSet } from "ahooks";
import Annotation from "../Annotation";

export interface AnnotListProps {
  annotations: AnnotationInfo[];
  getTags(itemId: number): TagInfo[];
  selectable?: boolean;
  collapsed: boolean;
}
export default function AnnotList({
  selectable = false,
  collapsed,
  annotations,
  getTags,
}: AnnotListProps) {
  const [selected, { add, remove }] = useSet<number>();
  return (
    <div
      role="list"
      className="@md:grid-cols-2 @md:gap-3 @3xl:grid-cols-4 grid grid-cols-1 gap-2"
    >
      {annotations.map((annot) => (
        <Annotation
          checkbox={
            selectable && (
              <Checkbox
                checked={selected.has(annot.itemID)}
                onChange={(checked) =>
                  checked ? add(annot.itemID) : remove(annot.itemID)
                }
              />
            )
          }
          collapsed={collapsed}
          key={annot.itemID}
          role="listitem"
          annotation={annot}
          tags={getTags(annot.itemID)}
        />
      ))}
    </div>
  );
}

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function Checkbox({ checked, onChange }: CheckboxProps) {
  return (
    <div className="flex h-5 items-center">
      <input
        type="checkbox"
        className="m-0 h-4 w-4"
        checked={checked}
        onChange={(evt) => onChange(evt.target.checked)}
      />
    </div>
  );
}
