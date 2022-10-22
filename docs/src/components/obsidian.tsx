import Admonition from "@theme/Admonition";
import clsx from "clsx";
import React, { useEffect, useState } from "react";
import { Availablity } from "./available";
import styles from "./available.module.css";

type ObsidianInfo = [ver: string, obVer: string];
export const ObInfo = ({
  info,
  beta,
}: {
  info: ObsidianInfo;
  beta: boolean;
}) => {
  if (!info) return null;
  const [version, obVersion] = info;
  return (
    <Admonition type="info">
      <div>
        Latest {beta && "Beta "}Version:
        <code className={clsx(styles.version)}>{version}</code>
      </div>
      <div>
        Required Obsidian Version:
        <code className={clsx(styles.version)}>{obVersion}</code>
      </div>
    </Admonition>
  );
};

export const ObInfoWithDownload = ({ info }: { info: ObsidianInfo }) => {
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
      <div>
        Download Link:
        <a className={clsx(styles.badge)} href={toDownloadLink(version)}>
          <img
            src="https://custom-icon-badges.demolab.com/badge/zotero--plugin-latest-8b6cef?logo=obsidian-full"
            alt="Latest Release"
          />
        </a>
      </div>
    </Admonition>
  );
};

const toDownloadLink = (ver: string) =>
  `https://github.com/aidenlx/obsidian-zotero/releases/download/${ver}/obsidian-zotero-plugin.zip`;

export const useManifest = (url: string) => {
  const [versions, setVersions] = useState<ObsidianInfo | null>(null);
  const [available, setAvailable] = useState(Availablity.checking);
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    fetch(url, { signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!json) {
          setAvailable(Availablity.no);
          setVersions(null);
        } else {
          setAvailable(Availablity.yes);
          const { version, minAppVersion } = json;
          setVersions([version, minAppVersion]);
        }
      })
      .catch((err) => {
        console.error(err);
        setAvailable(Availablity.unknown);
        setVersions(null);
      });
    return () => {
      controller.abort();
      setAvailable(Availablity.unknown);
      setVersions(null);
    };
  }, [url]);
  return [available, versions] as const;
};

export const mainManifest =
    "https://raw.githubusercontent.com/aidenlx/obsidian-zotero/master/manifest.json",
  betaManifest = `https://raw.githubusercontent.com/aidenlx/obsidian-zotero/master/manifest-beta.json`,
  pluginList =
    "https://raw.githubusercontent.com/obsidianmd/obsidian-releases/master/community-plugins.json";

export const usePluginList = () => {
  const [available, setAvailable] = useState(Availablity.checking);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    fetch(pluginList, { signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json && Array.isArray(json)) {
          if (
            json.findIndex(
              (plugin) => plugin.id === "obsidian-zotero-plugin",
            ) !== -1
          ) {
            setAvailable(Availablity.yes);
          } else {
            setAvailable(Availablity.no);
          }
        } else setAvailable(Availablity.unknown);
      })
      .catch((err) => {
        console.error(err);
        setAvailable(Availablity.unknown);
      });
    return () => {
      controller.abort();
      setAvailable(Availablity.unknown);
    };
  }, []);
  return available;
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
  console.log(val);
  return val;
};
