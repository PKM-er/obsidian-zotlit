export interface SettingsServer {
  enableServer: boolean;
  serverPort: number;
  serverHostname: string;
}

export const defaultSettingsServer: SettingsServer = {
  enableServer: false,
  serverPort: 9091,
  serverHostname: "127.0.0.1",
};
