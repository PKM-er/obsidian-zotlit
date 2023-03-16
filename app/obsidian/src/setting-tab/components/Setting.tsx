import { cn } from "@obzt/components/utils";
import { useMemoizedFn } from "ahooks";
import type { PropsWithChildren, ReactNode } from "react";
import { useContext, forwardRef } from "react";
import { SettingTabCtx } from "../common";
import type { Settings } from "@/settings/base";

export default forwardRef<
  HTMLDivElement,
  PropsWithChildren<{
    name: ReactNode;
    description?: ReactNode;
    className?: string;
    heading?: boolean;
  }>
>(function Setting({ name, description, heading, children, className }, ref) {
  return (
    <div
      className={cn(
        "setting-item",
        heading && "setting-item-heading",
        className,
      )}
    >
      <div className="setting-item-info">
        <div className="setting-item-name">{name}</div>
        {description && (
          <div className="setting-item-description">{description}</div>
        )}
      </div>
      <div className="setting-item-control" ref={ref}>
        {children}
      </div>
    </div>
  );
});

export function useApplySetting<
  Opts extends Record<string, any>,
  K extends keyof Opts,
>(settings: Settings<Opts> & Readonly<Opts>, key: K) {
  const {
    plugin: { settings: settingsLoader },
  } = useContext(SettingTabCtx);
  return useMemoizedFn(async function onChange(val: Opts[K]) {
    const updated = await settings.setOption(key, val as any).apply();
    if (updated === false) return false;
    await settingsLoader.save();
    return true;
  });
}
