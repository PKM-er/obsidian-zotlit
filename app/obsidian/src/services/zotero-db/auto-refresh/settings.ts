import { assertNever } from "assert-never";
import DatabaseWatcher from "./service";
import Settings from "@/settings/base";

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
