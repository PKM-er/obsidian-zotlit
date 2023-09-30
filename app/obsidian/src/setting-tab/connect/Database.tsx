import { dialog } from "@electron/remote";
import { Notice } from "obsidian";
import { useContext } from "react";
import { useAsyncCallback } from "react-async-hook";
import { SettingTabCtx } from "../common";
import Setting, { useSetting } from "../components/Setting";
import { DatabasePathWithTitle, DatabasePath } from "./DatabasePath";
import type { DatabaseStatus } from "./useDatabaseStatus";
import { useDatabaseStatus } from "./useDatabaseStatus";

export default function DatabaseSetting() {
  const mainDbPath = useDatabasePath("main");
  const bbtDbPath = useDatabasePath("bbt");

  const [mainDbStatus, refreshMainDb] = useDatabaseStatus("main");
  const [bbtDbStatus, refreshBbtDb] = useDatabaseStatus("bbt");

  const [dataDir, dataDirState, setDataDir] = useApplyDataDir(() => {
    refreshMainDb();
    refreshBbtDb();
  });

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

function useApplyDataDir(updateStatus: () => void) {
  const [datadir, setDataDir] = useSetting(
    (s) => s.zoteroDataDir,
    (v, prev) => ({ ...prev, zoteroDataDir: v }),
  );
  const { app } = useContext(SettingTabCtx);
  const asyncOnClick = useAsyncCallback(async () => {
    try {
      const {
        filePaths: [newFolder],
      } = await dialog.showOpenDialog({
        defaultPath: datadir,
        properties: ["openDirectory"],
      });
      if (newFolder && datadir !== newFolder) {
        setDataDir(newFolder);
        await new Promise<void>((resolve, reject) => {
          function callback() {
            resolve();
            app.vault.off("zotero:db-refresh", callback);
          }
          app.vault.on("zotero:db-refresh", callback);
          setTimeout(() => {
            reject(new DOMException("Timeout after 5s", "TimeoutError"));
            app.vault.off("zotero:db-refresh", callback);
          }, 5e3);
        });
        updateStatus();
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
  return [datadir, dataDirState, asyncOnClick.execute] as const;
}

function useDatabasePath(target: "main" | "bbt") {
  const service = useContext(SettingTabCtx).settings;
  const value =
    target === "main" ? service.zoteroDbPath : service.betterBibTexDbPath;
  return value;
}
