import type { HTMLAttributes, PropsWithChildren } from "react";
import AnnotDetailsToggle from "./AnnotDetailsToggle";
import type { HeaderIconProps } from "./HeaderIcon";
import HeaderIcon from "./HeaderIcon";
import MoreOptionsButton from "./MoreOptionsButton";

type HeaderProps = {
  onMoreOptions(evt: React.MouseEvent | React.KeyboardEvent): any;
  onDetailsToggled(): any;
} & DragProps &
  HeaderIconProps;

type DragProps = Pick<HTMLAttributes<HTMLElement>, "draggable" | "onDragStart">;

export default function Header({
  onMoreOptions,
  onDetailsToggled,
  draggable,
  onDragStart,
  icon,
  color,
  type,
  children,
}: PropsWithChildren<HeaderProps>) {
  return (
    <div className="annot-header" onContextMenu={onMoreOptions}>
      <div className="annot-action-container">
        <HeaderIcon
          draggable={draggable}
          onDragStart={onDragStart}
          icon={icon}
          color={color}
          type={type}
        />
        <AnnotDetailsToggle onClick={onDetailsToggled} />
        <MoreOptionsButton onClick={onMoreOptions} onKeyDown={onMoreOptions} />
      </div>
      <div className="annot-header-space" />
      {children}
    </div>
  );
}
