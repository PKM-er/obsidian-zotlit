import type { PropsWithChildren, ReactNode } from "react";
import type { Attributes } from "@c/utils";
import { cn as clsx } from "@c/utils";

interface HeaderProps extends Attributes {
  drag: ReactNode;
  checkbox: ReactNode;
  buttons: ReactNode;
  onMoreOptions(evt: React.MouseEvent | React.KeyboardEvent): any;
}

export default function Header({
  checkbox,
  drag,
  buttons,
  onMoreOptions,
  className,
  children,
  onContextMenu,
  ...props
}: PropsWithChildren<HeaderProps>) {
  return (
    <div
      className={clsx(
        "annot-header flex cursor-context-menu items-center gap-1",
        className,
      )}
      onContextMenu={onContextMenu ?? onMoreOptions}
      {...props}
    >
      {checkbox}
      <div className="annot-header-drag-container flex flex-row items-center gap-1">
        {drag}
      </div>
      <div className="annot-header-buttons-container flex flex-row items-center gap-1 opacity-0 transition-opacity hover:opacity-100">
        {buttons}
      </div>
      <div className="annot-header-space flex-1" />
      {children}
    </div>
  );
}
