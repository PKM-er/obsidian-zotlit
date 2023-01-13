import clsx from "clsx";
import { ErrorBoundary } from "react-error-boundary";
import { ItemDetails } from "../ItemView";
import type { DocHelperArgsPartial } from "./hooks/useDocHelperArgs";
import { useItemDetails } from "./hooks/useDocHelperArgs";

interface DocDetailsViewProps {
  showDetails: boolean;
  renderArgs: DocHelperArgsPartial | null;
}

export default function DocDetailsView({
  showDetails,
  renderArgs,
}: DocDetailsViewProps) {
  const item = useItemDetails(renderArgs);
  return (
    <div
      className={clsx("doc-details", {
        showing: showDetails,
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
        {item && <ItemDetails item={item} />}
      </ErrorBoundary>
    </div>
  );
}
