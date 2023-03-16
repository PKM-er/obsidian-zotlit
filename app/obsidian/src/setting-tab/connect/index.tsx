import { useContext } from "react";
import { SettingTabCtx } from "../common";
import BooleanSetting from "../components/Boolean";
import { BackgroundConnectSetting } from "./Background";
import DatabaseSetting from "./Database";

export default function Connect() {
  const {
    plugin: {
      settings: { watcher },
    },
  } = useContext(SettingTabCtx);
  return (
    <>
      <DatabaseSetting />
      <BooleanSetting
        name="Refresh automatically when Zotero updates database"
        settings={watcher}
        prop="autoRefresh"
      />
      <BackgroundConnectSetting />
    </>
  );
}
