import useIsBrowser from "@docusaurus/useIsBrowser";
import Admonition from "@theme/Admonition";
import clsx from "clsx";
import React, { useEffect, useMemo, useState } from "react";
import { Availablity, releaseUrl } from "./available";
import styles from "./available.module.css";

type ObsidianInfo = [ver: string, obVer: string];
export const ObInfo = ({ info }: { info: ObsidianInfo }) => {
  if (!info) return null;
  const [version, obVersion] = info;
  return (
    <Admonition type="info">
      <div>
        Latest Version:
        <code className={clsx(styles.version)}>{version}</code>
      </div>
      <div>
        Required Obsidian Version:
        <code className={clsx(styles.version)}>{obVersion}</code>
      </div>
    </Admonition>
  );
};

export const toDownloadLink = (file: string, ver: string | null = null) => {
  if (ver === "latest") {
    return `${releaseUrl}/latest/download/${file}`;
  } else if (ver) {
    return `${releaseUrl}/download/${ver}/${file}`;
  } else {
    return releaseUrl;
  }
};

export const useManifest = (...urls: string[]) => {
  const { data, error, isLoading } = useSWR(urls, async (urls) => {
    for (const url of urls) {
      const manifest = await fetch(url).then((r) => (r.ok ? r.json() : null));
      if (!manifest) continue;
      const { version, minAppVersion } = manifest;
      return [version, minAppVersion] as [string, string];
    }
  });
  return [
    isLoading
      ? Availablity.checking
      : error
      ? Availablity.unknown
      : data
      ? Availablity.yes
      : Availablity.no,
    data,
  ] as const;
};

export const mainManifest =
    "https://raw.githubusercontent.com/aidenlx/obsidian-zotero/master/manifest.json",
  betaManifest = `https://raw.githubusercontent.com/aidenlx/obsidian-zotero/master/manifest-beta.json`,
  pluginList =
    "https://raw.githubusercontent.com/obsidianmd/obsidian-releases/master/community-plugins.json";

import useSWR from "swr";

export const usePluginList = () => {
  const { data, error, isLoading } = useSWR(pluginList, (url) =>
    fetch(url).then((res) => res.json())
  );
  if (isLoading) return Availablity.checking;
  if (error) return Availablity.unknown;
  if (!(data && Array.isArray(data))) return Availablity.unknown;
  if (
    data.findIndex((plugin) => plugin.id === "obsidian-zotero-plugin") !== -1
  ) {
    return Availablity.yes;
  } else {
    return Availablity.no;
  }
};

export const useDefaultMethod = () => {
  const obAvailable = usePluginList();
  const [bratAvailable] = useManifest(betaManifest);
  let val: "brat" | "obsidian" | "manual" = "manual";
  if (
    bratAvailable === Availablity.checking ||
    obAvailable === Availablity.checking
  ) {
    val = "obsidian";
  }
  if (obAvailable === Availablity.yes) {
    val = "obsidian";
  } else if (bratAvailable === Availablity.yes) {
    val = "brat";
  }
  return val;
};
