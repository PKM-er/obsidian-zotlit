import { TextareaAutosize as Textarea } from "@mui/base";
import type { PropsWithChildren, ReactNode } from "react";
import { useState } from "react";
import SettingsComponent, { useApplySetting } from "./Setting";
import type { Settings } from "@/settings/base";
import { useIconRef } from "@/utils/icon";

export default function TextComfirmSetting<Opts extends Record<string, any>>({
  name,
  children,
  normalize,
  settings,
  prop,
}: PropsWithChildren<{
  name: ReactNode;
  settings: Settings<Opts> & Readonly<Opts>;
  prop: PickStringKeys<Opts>;
  normalize?: (val: string) => string;
}>) {
  const [value, setValue] = useState<string>(settings[prop]);
  const applySetting = useApplySetting(settings, prop) as (
    val: string,
  ) => Promise<boolean>;

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
        applySetting(normalized);
      }}
    >
      {children}
    </TextComfirmSettingBase>
  );
}

type PickStringKeys<T> = {
  [K in keyof T]: T[K] extends string ? K : never;
}[keyof T];

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
