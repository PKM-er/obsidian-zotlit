/* eslint-disable react-hooks/rules-of-hooks */
import React from "react";
import { AvailablityTag } from "./available";
import { betaManifest, mainManifest, ObInfo, useManifest } from "./obsidian";

export default function ManualAvailable() {
  const [available, versions] = useManifest(mainManifest, betaManifest);
  return (
    <AvailablityTag
      available={available}
      info={versions}
      infoComponent={ObInfo}
    />
  );
}
