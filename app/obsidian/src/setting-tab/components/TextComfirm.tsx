import { TextareaAutosize as Textarea } from "@obzt/components";
import type { PropsWithChildren, ReactNode } from "react";
import { useState } from "react";
import type { Settings } from "@/settings/service";
import { useIconRef } from "@/utils/icon";
import SettingsComponent, { useSetting } from "./Setting";

export default function TextComfirmSetting({
  name,
  children,
  normalize,
  get,
  set,
}: PropsWithChildren<{
  name: ReactNode;
  get: (settings: Settings) => string;
  set: (val: string, settings: Settings) => Settings;
  normalize?: (val: string) => string;
}>) {
  const [defaultValue, applyValue] = useSetting(get, set);
  const [value, setValue] = useState(defaultValue);
  return (
    <TextComfirmSettingBase
      name={name}
      value={value}
      onChange={(evt) => setValue(evt.target.value)}
      onSubmit={() => {
        const normalized = normalize?.(value) ?? value;
        if (normalized !== value) {
          setValue(normalized);
        }
        applyValue(normalized);
      }}
    >
      {children}
    </TextComfirmSettingBase>
  );
}

export function TextComfirmSettingBase({
  name,
  children,
  value,
  onChange,
  onSubmit,
}: PropsWithChildren<{
  name: ReactNode;
  value: string;
  onChange: React.ChangeEventHandler<HTMLTextAreaElement>;
  onSubmit: () => void;
}>) {
  const [checkIconRef] = useIconRef<HTMLButtonElement>("check");
  return (
    <SettingsComponent name={name} description={children}>
      {/** @ts-expect-error Pick util in ts5 pick non-existing keys with value unknown */}
      <Textarea className="border" value={value} onChange={onChange} />
      <button aria-label="Apply" ref={checkIconRef} onClick={onSubmit} />
    </SettingsComponent>
  );
}
