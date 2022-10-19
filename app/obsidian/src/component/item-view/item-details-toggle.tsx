import clsx from "clsx";
import { useAtom } from "jotai";
import { useIconRef } from "../../utils/icon";
import { useShowDetails } from "../annot-preview/atom";
import { GLOBAL_SCOPE } from "../atoms/utils";
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
      className={clsx("clickable-icon", { "is-active": show }, className)}
      onClick={onClick}
      aria-label={`${show ? "Hide" : "Show"} details`}
    />
  );
};

export const DocItemDetailsToggle = () => {
  const [show, setShow] = useAtom(showDocItemDetails, GLOBAL_SCOPE);
  return (
    <ItemDetailsToggle show={show} onClick={() => setShow((prev) => !prev)} />
  );
};

export const AnnotDetailsToggle = () => {
  const [show, setShow] = useShowDetails();
  return (
    <ItemDetailsToggle
      className="annot-header-details-toggle"
      show={show}
      onClick={() => setShow((prev) => !prev)}
    />
  );
};
