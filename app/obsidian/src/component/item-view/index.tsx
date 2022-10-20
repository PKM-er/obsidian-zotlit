import clsx from "clsx";
import { atom, useAtomValue } from "jotai";
import { loadable } from "jotai/utils";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { withItemHelper } from "../../template/helper/item";
import { activeAtchAtom, attachmentsAtom } from "../atoms/attachment";
import {
  activeDocItemAtom,
  helperContextAtom,
  tagsAtom,
} from "../atoms/obsidian";
import { GLOBAL_SCOPE } from "../atoms/utils";
import { ItemDetails } from "./item-details";

export const docItemAtom = loadable(activeDocItemAtom);

export const showDocItemDetails = atom(false);

const useItemDetails = () => {
  const item = useAtomValue(activeDocItemAtom, GLOBAL_SCOPE),
    attachment = useAtomValue(activeAtchAtom, GLOBAL_SCOPE),
    allAttachments = useAtomValue(attachmentsAtom, GLOBAL_SCOPE),
    ctx = useAtomValue(helperContextAtom, GLOBAL_SCOPE),
    tags = useAtomValue(tagsAtom, GLOBAL_SCOPE);
  if (item && tags && allAttachments && attachment)
    return withItemHelper(item, { attachment, allAttachments, tags }, ctx);
  else return null;
};

const DocDetails = () => {
  const item = useItemDetails();
  return item ? <ItemDetails item={item} /> : null;
};

export const DocDetailsView = () => {
  const showingDetails = useAtomValue(showDocItemDetails, GLOBAL_SCOPE);
  return (
    <div
      className={clsx("doc-details", {
        showing: showingDetails,
      })}
    >
      <ErrorBoundary
        FallbackComponent={({ error }) => (
          <div role="alert">
            <p>Something went wrong:</p>
            <pre>{error.message}</pre>
          </div>
        )}
      >
        <Suspense fallback={null}>
          <DocDetails />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
};
