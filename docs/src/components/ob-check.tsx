/* eslint-disable react-hooks/rules-of-hooks */
import BrowserOnly from "@docusaurus/BrowserOnly";
import React from "react";
import { Availablity, AvailablityTag } from "./available";
import { mainManifest, ObInfo, useManifest, usePluginList } from "./obsidian";

export default function ObsidianAvailable() {
  return (
    <BrowserOnly fallback={<span>{Availablity.checking}</span>}>
      {() => {
        const available = usePluginList();
        const [, versions] = useManifest(mainManifest);

        return (
          <AvailablityTag
            available={available}
            info={versions}
            infoComponent={ObInfo}
          />
        );
      }}
    </BrowserOnly>
  );
}
