import { assertNever } from "assert-never";
import Settings from "../settings-base";
import DatabaseWatcher from "./service";

interface SettingOptions {
  autoRefresh: boolean;
}

export class WatcherSettings extends Settings<SettingOptions> {
  getDefaults() {
    return {
      autoRefresh: true,
    };
  }
  async apply(key: keyof SettingOptions): Promise<void> {
    switch (key) {
      case "autoRefresh":
        return await this.use(DatabaseWatcher).setAutoRefresh(this.autoRefresh);
      default:
        assertNever(key);
    }
  }
}
