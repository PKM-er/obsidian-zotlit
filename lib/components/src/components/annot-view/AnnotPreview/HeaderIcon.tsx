import { AnnotationType } from "@obzt/zotero-type";
import clsx from "clsx";
import { startCase } from "lodash-es";
import { memo } from "react";
import { Icon } from "../icon";
import type { Attributes } from "../utils";

export interface HeaderIconProps {
  icon: string;
  color: string | null;
  type: AnnotationType;
}

export default memo(function HeaderIcon({
  icon,
  color,
  type,
  className,
  ...props
}: HeaderIconProps & Attributes) {
  const label = startCase(AnnotationType[type]);
  return (
    <Icon
      icon={icon}
      style={{ color: color ?? undefined }}
      className={clsx(
        className,
        "annot-type-icon",
        "flex h-auto cursor-grab items-center justify-center opacity-[var(--icon-opacity)]",
      )}
      aria-label={label}
      aria-label-delay="500"
      {...props}
    />
  );
});
