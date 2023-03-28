import type { KeyboardEvent, MouseEvent } from "react";
import { IconButton } from "../icon";

export interface FieldNameProps {
  name: string;
  onAdd: (evt: MouseEvent | KeyboardEvent) => void;
}

export function FieldName({ name, onAdd }: FieldNameProps) {
  return (
    <div className="bg-secondary text-txt-muted sticky top-0 z-10 flex flex-row items-center border-y py-1 pl-4 pr-2 text-base font-semibold">
      <h3 className="flex-1">{name}</h3>
      <IconButton icon="plus" onClick={onAdd} />
    </div>
  );
}
