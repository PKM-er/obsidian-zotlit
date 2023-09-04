import getPort from "get-port";
import { Notice } from "obsidian";
import { useContext, useMemo, useState } from "react";
import { useIconRef } from "@/utils/icon";
import { SettingTabCtx } from "../common";
import { BooleanSettingBase, useBoolean } from "../components/Boolean";
import Setting from "../components/Setting";

export function BackgroundConnectSetting() {
  const { server } = useContext(SettingTabCtx).plugin.settings;
  const [value, ref] = useBoolean(server, "enableServer");
  return (
    <>
      <Setting
        heading
        name="Background connect"
        description="Allow Zotero to send status in the background, which is required for some features like focus annotation on selection in Zotero"
      />
      <BooleanSettingBase ref={ref} name="Enable">
        Remember to enable the server in Zotero as well
      </BooleanSettingBase>
      {value && <ServerPort />}
    </>
  );
}

function ServerPort() {
  const { server } = useContext(SettingTabCtx).plugin.settings;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const defaultPort = useMemo(() => server.getDefaults().serverPort, []);
  const [port, setPort] = useState<number>(defaultPort);
  const [checkIconRef] = useIconRef<HTMLButtonElement>("check");
  async function apply() {
    if (isNaN(port) || port < 0 || port > 65535) {
      new Notice("Invalid port number: " + port);
      setPort(server.serverPort);
      return false;
    }
    if (port === server.serverPort) {
      // no need to save if port is not changed
      return false;
    }
    const portReady = await getPort({
      host: server.serverHostname,
      port: [port],
    });
    console.log(portReady, port);
    if (portReady !== port) {
      new Notice(
        `Port is currently occupied, a different port is provided: ${portReady}, confirm again to apply the change.`,
      );
      setPort(portReady);
      return false;
    }
    const result = server.setOption("serverPort", portReady);
    await result.apply();
    if (result.changed) {
      new Notice("Server port is saved and applied.");
    }
    return result.changed;
  }
  return (
    <Setting name="Port number" description={`Default to ${defaultPort}`}>
      <input
        type="number"
        value={port}
        min={0}
        max={65535}
        onChange={(evt) => setPort(Number.parseInt(evt.target.value, 10))}
      />
      <button aria-label="Apply" ref={checkIconRef} onClick={apply} />
    </Setting>
  );
}
