/* eslint-disable react-hooks/rules-of-hooks */
import BrowserOnly from "@docusaurus/BrowserOnly";
import React from "react";
import { Availablity, AvailablityTag } from "./available";
import { mainManifest, ObInfoWithDownload, useManifest } from "./obsidian";

export default function ManualAvailable() {
  return (
    <BrowserOnly fallback={<span>{Availablity.checking}</span>}>
      {() => {
        const [available, versions] = useManifest(mainManifest);
        return (
          <AvailablityTag
            available={available}
            info={versions}
            infoComponent={ObInfoWithDownload}
          />
        );
      }}
    </BrowserOnly>
  );
}
