import { logLevels } from "@obzt/common";
import type { LogLevel } from "@obzt/common";
import { useMemoizedFn } from "ahooks";
import { useContext, useState } from "react";

import { promptOpenLog } from "@/utils";
import { SettingTabCtx } from "../common";
import Setting, { useApplySetting } from "../components/Setting";

export default function LogLevel() {
  const { log } = useContext(SettingTabCtx).plugin.settings;

  const [value, setValue] = useState(() => log.level);
  const applySeting = useApplySetting(log, "level");

  const onChange = useMemoizedFn(async function onChange(
    evt: React.ChangeEvent<HTMLSelectElement>,
  ) {
    const val = evt.target.value as LogLevel;
    setValue(val);
    await applySeting(val);
  });

  return (
    <>
      <Setting heading name="Debug" />
      <Setting
        name="Log Level"
        description={
          <>
            Change level of logs output to the console.
            <br />
            Set to DEBUG if you need to report a issue
            <br />
            To check console, {promptOpenLog()}
          </>
        }
      >
        <select className="dropdown" onChange={onChange} value={value}>
          {Object.entries(logLevels).map(([label, value]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </Setting>
    </>
  );
}
