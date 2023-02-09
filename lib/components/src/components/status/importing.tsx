import type { CheckedState } from "@radix-ui/react-checkbox";
import { forwardRef, useState } from "react";
import type { Attributes } from "@c/utils";
import { cn } from "@c/utils";
import { Checkbox } from "./checkbox";

export interface ImportingStatusProps {
  id: string;
  title: string;
  disabled?: boolean;
  onCheckChange: (checked: CheckedState) => void;
  checked: CheckedState;
}

export const ImportingStatus = forwardRef<
  React.ElementRef<"div">,
  ImportingStatusProps & Attributes
>(
  (
    { id, checked, onCheckChange, title, disabled, className, ...props },
    ref,
  ) => {
    return (
      <div
        className={cn(
          "flex items-center gap-x-1",
          "rounded-sm focus-within:outline-none focus-within:ring-2 focus-within:ring-mod-border-focus focus-within:ring-offset-2",
          checked && "animate-pulse",
          className,
        )}
        ref={ref}
        {...props}
      >
        <Checkbox
          className={cn("h-3 w-3", disabled && "hidden")}
          id={id}
          checked={checked}
          disabled={disabled}
          onCheckedChange={onCheckChange}
        />
        <label
          htmlFor={id}
          className="peer-[[data-state=checked]]:text-mod-error text-status-bar text-txt-status-bar leading-none peer-disabled:cursor-not-allowed"
        >
          {title}
        </label>
      </div>
    );
  },
);

ImportingStatus.displayName = "ImportingStatus";

export function CheckboxDemo({
  id,
  title,
  disabled,
}: Pick<ImportingStatusProps, "id" | "title" | "disabled">) {
  const [checked, setChecked] = useState<"indeterminate" | boolean>(false);
  return (
    <ImportingStatus
      id={id}
      disabled={disabled}
      checked={checked}
      onCheckChange={setChecked}
      title={title}
    />
  );
}
