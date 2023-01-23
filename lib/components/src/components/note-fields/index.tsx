import clsx from "clsx";
import type { KeyboardEvent, MouseEvent } from "react";
import { useEffect, useRef, useState } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { IconButton } from "../icon";

export type NoteFieldsData = Record<string, WithID[]>;

type WithID = { id: number; value: string };

export interface NoteFieldsProps {
  data: NoteFieldsData;
  onChange: (value: string, field: string, index: number) => void;
  onDelete: (field: string, index: number) => void;
  onAdd: (field: string) => void;
}

export function NoteFields({
  data,
  onAdd,
  onDelete,
  onChange,
}: NoteFieldsProps) {
  const [editing, setEditing] = useState<{
    field: string;
    index: number;
  } | null>(null);
  return (
    <nav className="h-full overflow-y-auto">
      {Object.entries(data).map(([field, values]) => (
        <div key={field} className="relative">
          <FieldName
            name={field}
            onAdd={() => {
              onAdd(field);
              setEditing({ field, index: values.length });
            }}
          />
          <ul className="divide-bg-mod-border relative z-0 divide-y">
            {values.map((content, index) => {
              const isEditing =
                !!editing && editing.field === field && editing.index === index;
              return (
                <FieldValue
                  key={content.id}
                  value={content.value}
                  editing={isEditing}
                  onFocus={() => !isEditing && setEditing({ field, index })}
                  onBlur={() => isEditing && setEditing(null)}
                  onChange={(value) => onChange(value, field, index)}
                  onDelete={() => onDelete(field, index)}
                />
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export interface FieldNameProps {
  name: string;
  onAdd: (evt: MouseEvent | KeyboardEvent) => void;
}

export function FieldName({ name, onAdd }: FieldNameProps) {
  return (
    <div className="bg-bg-secondary text-txt-muted border-bg-mod-border sticky top-0 z-10 flex flex-row items-center border-y py-1 pl-4 pr-2 text-base font-semibold">
      <h3 className="flex-1">{name}</h3>
      <IconButton icon="plus" onClick={onAdd} />
    </div>
  );
}

export interface FieldValueProps {
  value: string;
  onChange: (value: string) => void;
  onDelete: () => void;
  editing: boolean;
  onFocus: () => void;
  onBlur: () => void;
}

export function FieldValue({
  value,
  onChange,
  onDelete,
  editing,
  onBlur,
  onFocus,
}: FieldValueProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!(editing && textareaRef.current)) return;
    const target = textareaRef.current as HTMLTextAreaElement & {
      scrollIntoViewIfNeeded?: (center?: boolean) => void;
    };

    if (!target.scrollIntoViewIfNeeded) {
      if (target.getBoundingClientRect().bottom > window.innerHeight) {
        target.scrollIntoView(false);
      }
      if (target.getBoundingClientRect().top < 0) {
        target.scrollIntoView();
      }
    } else {
      // https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoViewIfNeeded
      target.scrollIntoViewIfNeeded();
    }

    target.select();
  }, [editing]);

  return (
    <li className="bg-bg-primary">
      <div className="hover:bg-bg-mod-hover focus-within:ring-bg-mod-border-focus relative flex items-stretch space-x-1 py-3 pl-4 pr-2 focus-within:ring-2 focus-within:ring-inset">
        {editing ? (
          // why min-w-0? https://stackoverflow.com/a/66689926
          <div className="flex min-w-0 flex-1 items-center">
            <TextareaAutosize
              ref={textareaRef}
              className={clsx(
                "text-txt-normal w-full bg-transparent text-sm font-medium",
                "min-w-0 border-none p-0 ring-0 focus:border-none focus:ring-0 ",
              )}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onBlur={() => {
                onBlur();
                if (editing && !value) {
                  onDelete();
                }
              }}
              onKeyUp={(e) => {
                if (editing && e.key === "Escape") {
                  (e.target as HTMLTextAreaElement).blur();
                  onBlur();
                }
              }}
              // eslint-disable-next-line jsx-a11y/no-autofocus
              // autoFocus
            />
          </div>
        ) : (
          <div
            role="textbox"
            tabIndex={0}
            onClick={onFocus}
            onKeyUp={(e) => e.key === "Enter" && onFocus()}
            className="flex min-w-0 flex-1 items-center"
          >
            {/* prefer span over textarea when display to avoid expensive calc
              of height */}
            <p className="text-txt-normal min-w-0 break-words bg-transparent text-sm font-medium">
              {value}
            </p>
          </div>
        )}
        <div className="flex shrink-0 flex-col items-start opacity-0 transition-opacity hover:opacity-100">
          <IconButton icon="trash" onClick={onDelete} />
        </div>
      </div>
    </li>
  );
}
