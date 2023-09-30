import { cn } from "@obzt/components/utils";
// import { computed, effect } from "@ophidian/core";
import { computed } from "@preact/signals-core";
import { useMemoizedFn } from "ahooks";
import type { PropsWithChildren, ReactNode } from "react";
import { forwardRef, useContext, useMemo, useRef } from "react";
import type { Settings } from "@/settings/service";
import { SettingTabCtx } from "../common";

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
        heading && "setting-item-heading border-none",
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

export function useComputed<T>(compute: () => T) {
  const $compute = useRef(compute);
  $compute.current = compute;
  return useMemo(() => computed<T>(() => $compute.current()), []);
}

export function useSetting<T>(
  get: (settings: Settings) => T,
  set: (val: T, settings: Settings) => Settings,
) {
  const service = useContext(SettingTabCtx).settings;
  const value = useComputed(() => get(service.current)).value;
  const onChange = useMemoizedFn(function onChange(val: T) {
    service.update((prev) => set(val, prev));
  });
  return [value, onChange] as const;
}
