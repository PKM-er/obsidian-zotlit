/* eslint-disable react-hooks/rules-of-hooks */
import clsx from "clsx";
import React from "react";
import { AvailablityTag } from "./available";
import styles from "./available.module.css";
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
  const [, versions] = useManifest(mainManifest, betaManifest);
  let version = "latest";
  if (versions) {
    [version] = versions;
  }
  return (
    <a
      className={clsx(styles.badge)}
      href={toDownloadLink("obsidian-zotero-plugin.zip", version)}
    >
      <img src="/img/obsidian-download-badge.svg" alt="Latest Release" />
    </a>
  );
};
