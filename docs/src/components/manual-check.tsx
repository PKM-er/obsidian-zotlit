/* eslint-disable react-hooks/rules-of-hooks */
import React from "react";
import { AvailablityTag } from "./available";
import LatestBadge from "./latest-badge";
import {
  betaManifest,
  mainManifest,
  ObInfo,
  toDownloadLink,
  useManifest,
} from "./obsidian";

export function ManualAvailable() {
  const [available, versions] = useManifest(mainManifest, betaManifest);
  return (
    <AvailablityTag
      available={available}
      info={versions}
      infoComponent={ObInfo}
    />
  );
}

export const ReleaseLink = () => {
  const a = useManifest(mainManifest, betaManifest);
  console.log(a)
  const [, versions] = a
  let version = "latest";
  if (versions) {
    [version] = versions;
  }
  return (
    <LatestBadge
      href={toDownloadLink("obsidian-zotero-plugin.zip", version)}
      type="obsidian"
      newPage
    />
  );
};
