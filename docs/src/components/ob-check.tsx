/* eslint-disable react-hooks/rules-of-hooks */
import React from "react";
import { AvailablityTag } from "./available";
import { mainManifest, ObInfo, useManifest, usePluginList } from "./obsidian";

export default function ObsidianAvailable() {
  const available = usePluginList();
  const [, versions] = useManifest(mainManifest);

  return (
    <AvailablityTag
      available={available}
      info={versions}
      infoComponent={ObInfo}
    />
  );
}
