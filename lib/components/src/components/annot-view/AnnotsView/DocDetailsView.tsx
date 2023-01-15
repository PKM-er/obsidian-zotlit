import clsx from "clsx";
import { ErrorBoundary } from "react-error-boundary";
import { ItemDetails } from "../ItemView";

interface DocDetailsViewProps {
  showDetails: boolean;
  helper: any;
}

export default function DocDetailsView({
  showDetails,
  helper,
}: DocDetailsViewProps) {
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
        {helper && <ItemDetails item={helper} />}
      </ErrorBoundary>
    </div>
  );
}
