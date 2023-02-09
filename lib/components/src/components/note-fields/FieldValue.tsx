import { useEffect, useRef } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { cn as clsx } from "@c/utils";
import { IconButton } from "../icon";

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
    <li className="bg-primary">
      <div className="hover:bg-mod-hover focus-within:ring-bg-mod-border-focus relative flex items-stretch space-x-1 py-0.5 pl-4 pr-2 focus-within:ring-2 focus-within:ring-inset">
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
