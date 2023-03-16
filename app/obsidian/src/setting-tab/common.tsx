import { createContext, useCallback, useState } from "react";
import type { UseAsyncOptions, UseAsyncReturn } from "react-async-hook";
import { useAsync } from "react-async-hook";
import type ZoteroPlugin from "../zt-main";
import { InVaultPath } from "@/settings/invault-path";

export const SettingTabCtx = createContext<{
  plugin: ZoteroPlugin;
  closeTab: () => void;
}>({} as any);

export function normalizePath(path: string) {
  return new InVaultPath(path).path;
}

export function useRefreshAsync<R = unknown, Args extends any[] = any[]>(
  asyncFunction: () => Promise<R>,
  params: Args,
  options?: UseAsyncOptions<R>,
): [UseAsyncReturn<R, Args>, () => void];
export function useRefreshAsync<R = unknown, Args extends any[] = any[]>(
  asyncFunction: (...args: Args) => Promise<R>,
  params: Args,
  options?: UseAsyncOptions<R>,
): [UseAsyncReturn<R, Args>, () => void];
export function useRefreshAsync<R = unknown, Args extends any[] = any[]>(
  asyncFunction: (...args: Args) => Promise<R>,
  params: Args,
  options?: UseAsyncOptions<R>,
): [UseAsyncReturn<R, Args>, () => void] {
  // used to trigger refresh
  const [refreshToggle, setRefreshToggle] = useState<boolean>(false);
  return [
    useAsync<R, Args>(
      // add refresh param to slience deps warning
      asyncFunction,
      [...params, refreshToggle] as any,
      options,
    ),
    useCallback(() => setRefreshToggle((v) => !v), []),
  ];
}
