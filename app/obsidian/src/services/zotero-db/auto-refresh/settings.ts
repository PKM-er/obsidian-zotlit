export interface SettingsWatcher {
  autoRefresh: boolean;
}

export const defaultSettingsWatcher: SettingsWatcher = {
  autoRefresh: true,
};
