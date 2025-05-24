import { atom } from "jotai";
import { RESET } from "jotai/utils";
import type { Plugin } from "obsidian";
import { loadSettingsV1, migrateSettingsV1 } from "@/settings/migrations/1";
import type { LatestPluginSettings } from "./type";

const migrations = {
  1: migrateSettingsV1,
} as Record<number, (data: any) => any>;

const loadLatestSettings: (settings?: any) => LatestPluginSettings =
  loadSettingsV1;

export const atomWithPluginData = (plugin: Plugin) => {
  const snapshotAtom = atom<LatestPluginSettings | null>(null);
  const saveWithLock = createSaveWithLock(plugin);

  const reloadAtom = atom(null, async (_, set) => {
    const { value, migrated } = await loadSettings(plugin);
    if (migrated) {
      await saveWithLock(value);
    }
    set(snapshotAtom, value);
  });

  const exposedAtom = atom(
    (get) => get(snapshotAtom),
    (
      get,
      set,
      update:
        | Partial<LatestPluginSettings>
        | ((prev: LatestPluginSettings) => Partial<LatestPluginSettings>)
        | typeof RESET,
    ) => {
      if (update === RESET) {
        set(reloadAtom);
        return;
      }
      const currentValue = get(snapshotAtom);
      if (currentValue === null) {
        return;
      }
      const next = typeof update === "function" ? update(currentValue) : update;
      const nextValue = { ...currentValue, ...next };
      set(snapshotAtom, nextValue);
      saveWithLock(nextValue);
    },
  );
  return {
    atom: exposedAtom,
    reload: reloadAtom,
  };
};

function createSaveWithLock(plugin: Plugin) {
  let isSaving = false;
  let pendingValue: LatestPluginSettings | null = null;
  return async function saveWithLock(value: LatestPluginSettings) {
    if (isSaving) {
      // If already saving, store the newest value to be saved after current save completes
      pendingValue = value;
      return;
    }

    isSaving = true;
    try {
      await plugin.saveData(value);

      // Check if there's a pending save that came in while we were saving
      if (pendingValue !== null) {
        const valueToSave = pendingValue;
        pendingValue = null;
        await saveWithLock(valueToSave);
      }
    } finally {
      isSaving = false;
    }
  };
}

async function loadSettings(plugin: Plugin): Promise<{
  value: LatestPluginSettings;
  migrated: boolean;
}> {
  const defaultSettings = loadLatestSettings();
  try {
    const rawData = await plugin.loadData();
    if (!rawData) {
      // No existing data, use initial value
      return { value: defaultSettings, migrated: false };
    }

    const loadedData: { __VERSION__?: number } = rawData;

    // Check if version migration is needed
    const staleVersion = loadedData.__VERSION__ ?? 0;
    const currentVersion = defaultSettings.__VERSION__;
    if (staleVersion === currentVersion) {
      // No migration needed
      const settings = loadLatestSettings(loadedData);
      return { value: settings, migrated: false };
    }
    // Apply migrations in sequence from loaded version to current version
    let migratedData = { ...loadedData };
    for (let v = staleVersion + 1; v <= currentVersion; v++) {
      const migrationFn = migrations[v];
      if (migrationFn) {
        migratedData = migrationFn(migratedData);
      } else {
        throw new Error(`No migration function found for version ${v}`);
      }
    }
    return { value: migratedData as LatestPluginSettings, migrated: true };
  } catch (error) {
    console.error("Failed to load plugin data:", error);
    return { value: defaultSettings, migrated: false };
  }
}
