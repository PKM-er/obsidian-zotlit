import { assertNever } from "assert-never";
import Settings from "@/settings/base";
import { Server } from "./service";

interface SettingOptions {
  enableServer: boolean;
  serverPort: number;
  serverHostname: string;
}

export class ServerSettings extends Settings<SettingOptions> {
  getDefaults() {
    return {
      enableServer: false,
      serverPort: 9091,
      serverHostname: "127.0.0.1",
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
      case "serverHostname":
        server.reloadPort();
        return;
      default:
        assertNever(key);
    }
  }
}
