import { useMemoizedFn } from "ahooks";
import { ToggleComponent } from "obsidian";
import type { PropsWithChildren, ReactNode, RefCallback } from "react";
import { forwardRef, useState, useCallback, useEffect, useRef } from "react";
import SettingsComponent, { useApplySetting } from "./Setting";
import type { Settings } from "@/settings/base";

function useSwitch(value: boolean, onChange: (value: boolean) => void) {
  const onChangeImmu = useMemoizedFn(onChange);
  const compRef = useRef<ToggleComponent | null>(null);
  useEffect(() => {
    compRef.current?.setValue(value);
  }, [value]);
  return useCallback<RefCallback<HTMLDivElement>>(
    (node) => {
      if (!node) {
        compRef.current?.toggleEl.remove();
        compRef.current = null;
      } else {
        const comp = new ToggleComponent(node);
        comp.setValue(value);
        comp.onChange(onChangeImmu);
        compRef.current = comp;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
}

export default function BooleanSetting<Opts extends Record<string, any>>({
  name,
  children: description,
  settings,
  prop,
}: PropsWithChildren<{
  name: ReactNode;
  settings: Settings<Opts> & Readonly<Opts>;
  prop: PickBooleanKeys<Opts>;
}>) {
  const [, ref] = useBoolean(settings, prop);
  return (
    <BooleanSettingBase ref={ref} name={name}>
      {description}
    </BooleanSettingBase>
  );
}

export const BooleanSettingBase = forwardRef<
  HTMLDivElement,
  PropsWithChildren<{ name: ReactNode }>
>(function BooleanSettingBase({ name, children }, ref) {
  return (
    <SettingsComponent
      className="mod-toggle"
      ref={ref}
      name={name}
      description={children}
    />
  );
});

type PickBooleanKeys<T> = {
  [K in keyof T]: T[K] extends boolean ? K : never;
}[keyof T];

export function useBoolean<Opts extends Record<string, any>>(
  settings: Settings<Opts> & Readonly<Opts>,
  key: PickBooleanKeys<Opts>,
) {
  const [value, setValue] = useState<boolean>(settings[key]);
  const applySeting = useApplySetting(settings, key) as (
    val: boolean,
  ) => Promise<boolean>;
  const onChange = useMemoizedFn(async function onChange(val: boolean) {
    setValue(val);
    await applySeting(val);
  });
  return [value, useSwitch(value, onChange)] as const;
}
