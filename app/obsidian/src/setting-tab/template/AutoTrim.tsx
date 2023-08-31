import { useMemoizedFn } from "ahooks";
import type { trimConfig } from "eta-prf";
import { useState, useContext } from "react";
import { SettingTabCtx } from "../common";
import SettingsComponent, { useApplySetting } from "../components/Setting";

type EtaTrimConfigOption = "false" | "nl" | "slurp";

export default function AutoTrimSetting() {
  const { plugin } = useContext(SettingTabCtx);
  const { template } = plugin.settings;
  const [leading, setLeading] = useState<trimConfig>(
    () => template.autoTrim[0],
  );
  const [ending, setEnding] = useState<trimConfig>(() => template.autoTrim[1]);

  const applySeting = useApplySetting(template, "autoTrim");
  const onModeChange = useMemoizedFn(async function onChange(
    option: EtaTrimConfigOption,
    index: 0 | 1,
  ) {
    const value = option === "false" ? false : option;
    if (index === 0) {
      setLeading(value);
      await applySeting([value, ending]);
    } else {
      setEnding(value);
      await applySeting([leading, value]);
    }
  });

  return (
    <SettingsComponent
      name="Auto Trim"
      description={
        <>
          <p className="text-sm">
            Controls default whitespace/new line trimming before/after a ejs{" "}
            <code className="whitespace-nowrap">&lt;% Tag %&gt;</code>
          </p>
          <dl className="mt-2">
            <div className="grid grid-cols-2 gap-1">
              <div>
                <dt className="text-xs font-medium text-txt-normal">
                  Newline Slurp
                </dt>
                <dd className="mt-1">
                  Removes the following newline before and after the tag.
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-txt-normal">
                  Whitespace Slurp:
                </dt>
                <dd className="mt-1">
                  Removes all whitespace before and after the tag.
                </dd>
              </div>
            </div>
          </dl>
        </>
      }
    >
      <div className="flex flex-col gap-2">
        {([0, 1] as const).map((i) => (
          <div className="flex flex-col items-start gap-1 text-sm" key={i}>
            <span>{i === 0 ? "Leading" : "Ending"}</span>
            <select
              className="dropdown"
              onChange={(evt) =>
                onModeChange(evt.target.value as EtaTrimConfigOption, i)
              }
              value={String(i === 0 ? leading : ending)}
            >
              <option value={"false" satisfies EtaTrimConfigOption} key={0}>
                Disable
              </option>
              <option value={"nl" satisfies EtaTrimConfigOption} key={1}>
                Newline Slurp
              </option>
              <option value={"slurp" satisfies EtaTrimConfigOption} key={2}>
                Whitespace Slurp
              </option>
            </select>
          </div>
        ))}
      </div>
    </SettingsComponent>
  );
}
