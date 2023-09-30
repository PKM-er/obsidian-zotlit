import { useContext } from "react";
import { SettingTabCtx } from "../common";
import BooleanSetting from "../components/Boolean";
import { BackgroundConnectSetting } from "./Background";
import DatabaseSetting from "./Database";

export default function Connect() {
  return (
    <>
      <DatabaseSetting />
      <BooleanSetting
        name="Refresh automatically when Zotero updates database"
        get={(s) => s.autoRefresh}
        set={(v, s) => ({ ...s, autoRefresh: v })}
      />
      <BackgroundConnectSetting />
    </>
  );
}
