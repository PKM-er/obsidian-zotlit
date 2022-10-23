import useIsBrowser from "@docusaurus/useIsBrowser";
import Admonition from "@theme/Admonition";
import clsx from "clsx";
import React, { useEffect, useState } from "react";
import { Availablity } from "./available";
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

export const toDownloadLink = (file: string, ver = "latest") =>
  ver === "latest"
    ? `https://github.com/aidenlx/obsidian-zotero/releases/latest/download/${file}`
    : `https://github.com/aidenlx/obsidian-zotero/releases/download/${ver}/${file}`;

export const useManifest = (...urls: string[]) => {
  const [versions, setVersions] = useState<ObsidianInfo | null>(null);
  const [available, setAvailable] = useState(Availablity.checking);
  const isBrowser = useIsBrowser();
  useEffect(() => {
    if (!isBrowser) return;
    const controller = new AbortController();
    const signal = controller.signal;

    const request = (url: string) =>
      fetch(url, { signal })
        .then((res) => (res.ok ? res.json() : null))
        .then((json) => {
          if (!json) {
            return null;
          } else {
            const { version, minAppVersion } = json;
            return [version, minAppVersion] as [string, string];
          }
        });
    request(urls[0])
      .then((info) => {
        if (!info) {
          setAvailable(Availablity.no);
          setVersions(null);
        } else {
          setAvailable(Availablity.yes);
          setVersions(info);
        }
      })
      .catch((err) => {
        console.error(err);
        setAvailable(Availablity.unknown);
        setVersions(null);
      });

    (async () => {
      try {
        let info: [string, string] | null;
        for (const url of urls) {
          info = await request(url);
          if (info) break;
        }

        if (info) {
          setAvailable(Availablity.yes);
          setVersions(info);
        } else {
          setAvailable(Availablity.no);
          setVersions(null);
        }
      } catch (err) {
        console.error(err);
        setAvailable(Availablity.unknown);
        setVersions(null);
      }
    })();
    return () => {
      controller.abort();
      setAvailable(Availablity.unknown);
      setVersions(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBrowser, urls.toString()]);
  return [available, versions] as const;
};

export const mainManifest =
    "https://raw.githubusercontent.com/aidenlx/obsidian-zotero/master/manifest.json",
  betaManifest = `https://raw.githubusercontent.com/aidenlx/obsidian-zotero/master/manifest-beta.json`,
  pluginList =
    "https://raw.githubusercontent.com/obsidianmd/obsidian-releases/master/community-plugins.json";

export const usePluginList = () => {
  const [available, setAvailable] = useState(Availablity.checking);

  const isBrowser = useIsBrowser();
  useEffect(() => {
    if (!isBrowser) return;
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
  }, [isBrowser]);
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
