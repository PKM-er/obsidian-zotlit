import { useContext } from "react";
import { SettingTabCtx, useRefreshAsync } from "../common";

export function useDatabaseStatus(target: "main" | "bbt") {
  const { database } = useContext(SettingTabCtx);
  const [promise, refresh] = useRefreshAsync(
    () => database.api.checkDbStatus(target),
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
