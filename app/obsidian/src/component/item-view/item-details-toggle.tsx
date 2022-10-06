import cls from "classnames";
import { useAtom } from "jotai";
import type { AnnotProps } from "../atoms/annotation";
import { useShowDetails } from "../atoms/annotation";
import { useIconRef } from "../icon";
import { showDocItemDetails } from ".";

const ItemDetailsToggle = ({
  show,
  onClick,
  className,
}: {
  show: boolean;
  className?: string;
  onClick: () => void;
}) => {
  const [ref] = useIconRef<HTMLButtonElement>("info");
  return (
    <button
      ref={ref}
      className={cls("clickable-icon", { "is-active": show }, className)}
      onClick={onClick}
      aria-label={`${show ? "Hide" : "Show"} details`}
    />
  );
};

export const DocItemDetailsToggle = () => {
  const [show, setShow] = useAtom(showDocItemDetails);
  return (
    <ItemDetailsToggle show={show} onClick={() => setShow((prev) => !prev)} />
  );
};

export const AnnotDetailsToggle = ({ annotAtom }: AnnotProps) => {
  const [show, setShow] = useShowDetails(annotAtom);
  return (
    <ItemDetailsToggle
      className="annot-header-details-toggle"
      show={show}
      onClick={() => setShow((prev) => !prev)}
    />
  );
};
