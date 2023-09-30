import type { App } from "obsidian";
import { createContext, useCallback, useState } from "react";
import type { UseAsyncOptions, UseAsyncReturn } from "react-async-hook";
import { useAsync } from "react-async-hook";
import type { DatabaseWorker } from "@/services/zotero-db";
import type { SettingsService } from "@/settings/base";
import { InVaultPath } from "@/settings/invault-path";

export const SettingTabCtx = createContext<{
  settings: SettingsService;
  app: App;
  database: DatabaseWorker;
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
