/* eslint-disable react-hooks/rules-of-hooks */
import clsx from "clsx";
import React from "react";
import { AvailablityTag, releaseUrl } from "./available";
import styles from "./available.module.css";
import LatestBadge from "./latest-badge";
import {
  updateInfoUrl,
  useUpdateRDF,
  useZoteroRelease,
  ZtInfo,
} from "./zotero";

export function ZoteroDownload() {
  const [available, info] = useUpdateRDF(updateInfoUrl);
  return (
    <AvailablityTag available={available} info={info} infoComponent={ZtInfo} />
  );
}

export const ReleaseLink = () => {
  const [, versions] = useUpdateRDF(updateInfoUrl);
  const latestRelease = useZoteroRelease();
  let updateLink: string | null = null;
  if (versions) {
    [, updateLink] = versions;
  }
  return (
    <LatestBadge
      href={updateLink ?? latestRelease ?? releaseUrl}
      type="zotero"
      newPage
    />
  );
};

export const ReleaseTag = () => {
  return (
    <img
      className={clsx(styles.badge)}
      src="https://custom-icon-badges.demolab.com/badge/dynamic/json?color=bc3a3c&label=&query=version&url=https%3A%2F%2Fraw.githubusercontent.com%2Faidenlx%2Fobsidian-zotero%2Fmaster%2Fapp%2Fzotero%2Fpackage.json&logo=zotero-32&prefix=zt"
      alt="latest zotero plugin version"
    />
  );
};
