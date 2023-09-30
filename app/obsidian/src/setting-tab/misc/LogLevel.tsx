import { logLevels } from "@obzt/common";
import type { LogLevel } from "@obzt/common";

import { promptOpenLog } from "@/utils";
import Setting, { useSetting } from "../components/Setting";

export default function LogLevel() {
  const [value, handleChange] = useSetting(
    (s) => s.logLevel,
    (v, prev) => ({ ...prev, logLevel: v }),
  );

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
        <select
          className="dropdown"
          onChange={(evt) => {
            const val = evt.target.value as LogLevel;
            handleChange(val);
          }}
          value={value}
        >
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
