/* eslint-disable react-hooks/rules-of-hooks */
import BrowserOnly from "@docusaurus/BrowserOnly";
import React from "react";
import { Availablity, AvailablityTag } from "./available";
import { betaManifest, ObInfo, useManifest } from "./obsidian";

export default function BRATAvailable() {
  return (
    <BrowserOnly fallback={<span>{Availablity.checking}</span>}>
      {() => {
        const [available, versions] = useManifest(betaManifest);
        return (
          <AvailablityTag
            available={available}
            info={versions}
            infoComponent={ObInfo}
            beta
          />
        );
      }}
    </BrowserOnly>
  );
}
