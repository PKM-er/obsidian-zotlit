import Settings from "../settings-base";

interface SettingOptions {
  autoRefresh: boolean;
}

export class WatcherSettings extends Settings<SettingOptions> {
  getDefaults() {
    return {
      autoRefresh: true,
    };
  }
}
