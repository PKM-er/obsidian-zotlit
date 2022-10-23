/* eslint-disable react-hooks/rules-of-hooks */
import React from "react";
import { AvailablityTag } from "./available";
import { betaManifest, ObInfo, useManifest } from "./obsidian";

export default function BRATAvailable() {
  const [available, versions] = useManifest(betaManifest);
  return (
    <AvailablityTag
      available={available}
      info={versions}
      infoComponent={ObInfo}
    />
  );
}
