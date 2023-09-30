import { useMemoizedFn } from "ahooks";
import { ToggleComponent } from "obsidian";
import type { PropsWithChildren, ReactNode, RefCallback } from "react";
import { forwardRef, useCallback, useEffect, useRef } from "react";
import type { Settings } from "@/settings/service";
import SettingsComponent, { useSetting } from "./Setting";

export function useSwitch(value: boolean, onChange: (value: boolean) => void) {
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

export default function BooleanSetting({
  name,
  children: description,
  get,
  set,
}: PropsWithChildren<{
  name: ReactNode;
  get: (settings: Settings) => boolean;
  set: (val: boolean, settings: Settings) => Settings;
}>) {
  const ref = useSwitch(...useSetting(get, set));
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
