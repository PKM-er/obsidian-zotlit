import { dialog } from "@electron/remote";
import { cn } from "@obzt/components/utils";
import { useMemoizedFn } from "ahooks";
import { assertNever } from "assert-never";
import { Notice } from "obsidian";
import type { PropsWithChildren } from "react";
import { useCallback, useContext, useState } from "react";
import { useAsyncCallback } from "react-async-hook";
import { SettingTabCtx, useRefreshAsync } from "../common";
import Setting from "../components/Setting";

export default function DatabaseSetting() {
  const [mainDbPath, mainDbStatus, refreshMainDb] = useDatabaseInfo("main");
  const [bbtDbPath, bbtDbStatus, refreshBbtDb] = useDatabaseInfo("bbt");
  const [dataDir, refreshDataDir] = useDatabasePath("data");

  const [dataDirState, setDataDir] = useSetDataDir(
    useMemoizedFn(() => {
      refreshDataDir();
      refreshMainDb();
      refreshBbtDb();
    }),
  );

  return (
    <Setting
      name="Zotero data directory"
      description={
        <>
          <DatabasePathWithTitle path={mainDbPath} state={mainDbStatus}>
            Zotero
          </DatabasePathWithTitle>
          <DatabasePathWithTitle path={bbtDbPath} state={bbtDbStatus}>
            Better BibTeX
          </DatabasePathWithTitle>
        </>
      }
    >
      <DatabasePath path={dataDir} state={dataDirState} />
      <button onClick={setDataDir}>Select</button>
    </Setting>
  );
}

function useDatabaseStatus(target: "main" | "bbt") {
  const { plugin } = useContext(SettingTabCtx);
  const [promise, refresh] = useRefreshAsync(
    () => plugin.databaseAPI.checkDbStatus(target),
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

type DatabaseStatus = "success" | "failed" | "disabled";

function useDatabaseInfo(target: "main" | "bbt") {
  const [path, refreshPath] = useDatabasePath(target);
  const [status, refreshStatus] = useDatabaseStatus(target);
  return [
    path,
    status,
    useCallback(() => {
      refreshPath();
      refreshStatus();
    }, [refreshPath, refreshStatus]),
  ] as const;
}

function useSetDataDir(refresh: () => void) {
  const {
    plugin: { settings },
  } = useContext(SettingTabCtx);
  const asyncOnClick = useAsyncCallback(async () => {
    try {
      const {
        filePaths: [newFolder],
      } = await dialog.showOpenDialog({
        defaultPath: settings.database.zoteroDataDir,
        properties: ["openDirectory"],
      });
      if (newFolder && settings.database.zoteroDataDir !== newFolder) {
        await settings.database.setOption("zoteroDataDir", newFolder).apply();
        await settings.save();
        refresh();
      }
    } catch (err) {
      // show error in obsidian before react catches it
      console.error("Failed to set data directory", err);
      new Notice(`Failed to set data directory: ${err}`);
      throw err;
    }
  });
  let dataDirState: DatabaseStatus;
  if (asyncOnClick.loading) {
    dataDirState = "disabled";
  } else if (asyncOnClick.error) {
    dataDirState = "failed";
  } else {
    dataDirState = "success";
  }
  return [dataDirState, asyncOnClick.execute] as const;
}

function useDatabasePath(target: "main" | "bbt" | "data") {
  const {
    plugin: {
      settings: { database },
    },
  } = useContext(SettingTabCtx);
  const getDatabasePath = useCallback(() => {
    switch (target) {
      case "main":
        return database.zoteroDbPath;
      case "bbt":
        return database.betterBibTexDbPath;
      case "data":
        return database.zoteroDataDir;
      default:
        assertNever(target);
    }
  }, [target, database]);
  const [value, setValue] = useState(getDatabasePath);

  return [
    value,
    useCallback(() => setValue(getDatabasePath), [getDatabasePath]),
  ] as const;
}

function DatabasePathWithTitle({
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

function DatabasePath({
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
