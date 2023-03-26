import useIsBrowser from "@docusaurus/useIsBrowser";
import Admonition from "@theme/Admonition";
import clsx from "clsx";
import React, { useEffect, useState } from "react";
import { Availablity } from "./available";
import styles from "./available.module.css";

export const updateInfoUrl =
  "https://raw.githubusercontent.com/aidenlx/obsidian-zotero/master/app/zotero/update.json";

export type ZoteroInfo = [
  version: string,
  updateLink: string,
  zoteroSupports: (6 | 7)[]
];

export const ZtInfo = ({ info }: { info: ZoteroInfo }) => {
  if (!info) return null;
  const [pluginVersion, _, zoteroSupports] = info;
  return (
    <Admonition type="info">
      <div>
        Latest Version:
        <code className={clsx(styles.version)}>{pluginVersion}</code>
      </div>
      <div>
        Support:
        <code className={clsx(styles.version)}>
          {zoteroSupports.map((v) => `Zotero ${v}`).join(", ")}
        </code>
      </div>
    </Admonition>
  );
};

export const useUpdateRDF = (url: string) => {
  const [info, setInfo] = useState<ZoteroInfo | null>(null);
  const [available, setAvailable] = useState(Availablity.checking);

  const isBrowser = useIsBrowser();
  useEffect(() => {
    if (!isBrowser) return;
    const controller = new AbortController();
    const signal = controller.signal;
    fetch(url, { signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const versions = data?.addons?.["zotero-obsidian-note@aidenlx.top"] as
          | {
              version: string;
              update_link: string;
              update_info_url: string;
              applications: {
                gecko: {
                  strict_min_version: string;
                  strict_max_version: string;
                };
                zotero: {
                  strict_min_version: string;
                  strict_max_version: string;
                };
              };
            }[]
          | undefined;
        if (!versions || !Array.isArray(versions) || versions.length === 0) {
          setInfo(null);
          setAvailable(Availablity.no);
        } else {
          const v = versions.at(-1);
          setAvailable(Availablity.yes);
          const zoteroSupports = [];
          if (
            v.applications.gecko &&
            v.applications.gecko.strict_min_version === "60.9"
          ) {
            zoteroSupports.push(6);
          }
          if (v.applications.zotero) {
            zoteroSupports.push(7);
          }
          setInfo([v.version, v.update_link, zoteroSupports]);
        }
      })
      .catch((err) => {
        console.error(err);
        setAvailable(Availablity.unknown);

        setInfo(null);
      });
    return () => {
      controller.abort();
      setAvailable(Availablity.unknown);

      setInfo(null);
    };
  }, [isBrowser, url]);
  return [available, info] as const;
};
