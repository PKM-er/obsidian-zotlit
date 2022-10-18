import cls from "classnames";
import { useAtom } from "jotai";
import { useShowDetails } from "../annot-preview/atom";
import { GLOBAL_SCOPE } from "../atoms/utils";
import { useIconRef } from "../../utils/icon";
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
