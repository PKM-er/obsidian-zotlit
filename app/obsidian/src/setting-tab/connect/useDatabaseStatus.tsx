import { useContext } from "react";
import { SettingTabCtx, useRefreshAsync } from "../common";

export function useDatabaseStatus(target: "zotero" | "bbt") {
  const { database } = useContext(SettingTabCtx);
  const [promise, refresh] = useRefreshAsync(
    () => database.api.getLoadStatus(),
    [target],
  );

  let state: DatabaseStatus;
  if (promise.loading) {
    state = "disabled";
  } else if (promise.error) {
    state = "failed";
  } else {
    state =
      target === "zotero"
        ? promise.result?.main
          ? "success"
          : "failed"
        : promise.result?.bbt
        ? "success"
        : "failed";
  }
  return [state, refresh, promise.result] as const;
}
export type DatabaseStatus = "success" | "failed" | "disabled";
