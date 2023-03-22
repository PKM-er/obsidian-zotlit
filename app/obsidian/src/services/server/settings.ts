import { assertNever } from "assert-never";
import Settings from "@/settings/base";
import { Server } from "./service";

interface SettingOptions {
  enableServer: boolean;
  serverPort: number;
}

export class ServerSettings extends Settings<SettingOptions> {
  getDefaults() {
    return {
      enableServer: false,
      serverPort: 9091,
    };
  }
  async apply(key: keyof SettingOptions): Promise<void> {
    const server = this.use(Server);
    switch (key) {
      case "enableServer":
        if (this.enableServer) {
          server.initServer();
        } else {
          server.closeServer();
        }
        return;
      case "serverPort":
        server.reloadPort();
        return;
      default:
        assertNever(key);
    }
  }
}
