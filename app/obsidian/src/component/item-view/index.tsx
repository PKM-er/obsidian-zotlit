import assertNever from "assert-never";
import cls from "classnames";
import { atom, useAtomValue } from "jotai";
import { loadable } from "jotai/utils";
import { activeDocItemAtom } from "../atoms/obsidian";
import { GLOBAL_SCOPE } from "../atoms/utils";
import { ItemDetails } from "./item-details";

export const docItemAtom = loadable(activeDocItemAtom);

export const showDocItemDetails = atom(false);

export const DocDetailsView = () => {
  const activeDocItem = useAtomValue(docItemAtom, GLOBAL_SCOPE);
  const showingDetails = useAtomValue(showDocItemDetails, GLOBAL_SCOPE);

  let details;
  if (activeDocItem.state === "hasData") {
    details = <ItemDetails item={activeDocItem.data} />;
  } else if (activeDocItem.state === "loading") {
    details = null;
  } else if (activeDocItem.state === "hasError") {
    details = <div>An Error Occurred: {activeDocItem.error}</div>;
  } else assertNever(activeDocItem);

  return (
    <div
      className={cls("doc-details", {
        loading: activeDocItem.state === "loading",
        showing: showingDetails,
      })}
    >
      {details}
    </div>
  );
};
