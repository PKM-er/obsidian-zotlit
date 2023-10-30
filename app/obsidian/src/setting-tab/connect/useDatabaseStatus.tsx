import { useContext } from "react";
import { SettingTabCtx, useRefreshAsync } from "../common";

export function useDatabaseStatus(target: "zotero" | "bbt") {
  const { database } = useContext(SettingTabCtx);
  const [promise, refresh] = useRefreshAsync(
    () =>
      database.api
        .getLoadStatus()
        .then((s) => (target === "zotero" ? s.main : s.bbt)),
    [target],
  );

  let state: DatabaseStatus;
  if (promise.loading) {
    state = "disabled";
  } else if (promise.error) {
    state = "failed";
  } else {
    state = promise.result ? "success" : "failed";
  }
  return [state, refresh] as const;
}
export type DatabaseStatus = "success" | "failed" | "disabled";
