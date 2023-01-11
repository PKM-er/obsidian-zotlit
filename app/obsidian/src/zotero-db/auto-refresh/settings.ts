import { assertNever } from "assert-never";
import Settings from "../settings-base";
import DatabaseWatcher from "./service";

interface SettingOptions {
  autoRefresh: boolean;
  /** used to make assert never work (not working with one field...) */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  _p?: never;
}

export class WatcherSettings extends Settings<SettingOptions> {
  getDefaults() {
    return {
      autoRefresh: true,
    };
  }
  async setOption<K extends keyof SettingOptions>(
    key: K,
    value: SettingOptions[K],
  ): Promise<void> {
    await super.setOption(key, value);
    switch (key) {
      case "autoRefresh":
        await this.use(DatabaseWatcher).setAutoRefresh(
          value as SettingOptions["autoRefresh"],
        );
        break;
      case "_p":
        break;
      default:
        assertNever(key);
    }
  }
}
