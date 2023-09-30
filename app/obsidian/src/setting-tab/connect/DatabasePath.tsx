import { cn } from "@obzt/components/utils";
import type { PropsWithChildren } from "react";
import type { DatabaseStatus } from "./useDatabaseStatus";

export function DatabasePathWithTitle({
  children: name,
  path,
  state,
}: PropsWithChildren<{
  path: string;
  state: DatabaseStatus;
}>) {
  return (
    <div>
      {name}: {state === "failed" && "(Failed to load)"}
      <DatabasePath path={path} state={state} />
    </div>
  );
}
export function DatabasePath({
  path,
  state,
}: {
  path: string;
  state: DatabaseStatus;
}) {
  return (
    <code
      data-state={state}
      className={cn(
        "data-[state=success]:text-txt-success",
        "data-[state=failed]:text-txt-error",
        "data-[state=disabled]:text-txt-muted",
      )}
    >
      {path}
    </code>
  );
}
