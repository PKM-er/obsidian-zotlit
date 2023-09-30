import getPort from "get-port";
import { Notice } from "obsidian";
import { useState } from "react";
import { useIconRef } from "@/utils/icon";
import { BooleanSettingBase, useSwitch } from "../components/Boolean";
import Setting, { useSetting } from "../components/Setting";

export function BackgroundConnectSetting() {
  const [value, setValue] = useSetting(
    (s) => s.enableServer,
    (v, s) => ({ ...s, enableServer: v }),
  );
  const ref = useSwitch(value, setValue);
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
  const [defaultPort, applyPort] = useSetting(
    (s) => s.serverPort,
    (v, prev) => ({ ...prev, serverPort: v }),
  );
  const [hostname] = useSetting(
    (s) => s.serverHostname,
    (v, prev) => ({ ...prev, serverHostname: v }),
  );
  const [port, setPort] = useState<number>(defaultPort);
  const [checkIconRef] = useIconRef<HTMLButtonElement>("check");
  async function apply() {
    if (isNaN(port) || port < 0 || port > 65535) {
      new Notice("Invalid port number: " + port);
      setPort(defaultPort);
      return false;
    }
    if (port === defaultPort) {
      // no need to save if port is not changed
      return false;
    }
    const portReady = await getPort({
      host: hostname,
      port: [port],
    });
    if (portReady !== port) {
      new Notice(
        `Port is currently occupied, a different port is provided: ${portReady}, confirm again to apply the change.`,
      );
      setPort(portReady);
      return false;
    }
    applyPort(portReady);
    return true;
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
