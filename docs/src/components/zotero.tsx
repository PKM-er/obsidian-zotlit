import useIsBrowser from "@docusaurus/useIsBrowser";
import Admonition from "@theme/Admonition";
import clsx from "clsx";
import React, { useEffect, useMemo, useState } from "react";
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
        {zoteroSupports.map((v) => (
          <code key={v} className={clsx(styles.version)}>
            Zotero {v}
          </code>
        ))}
      </div>
    </Admonition>
  );
};

import useSWR from "swr";

export const useUpdateRDF = (url: string) => {
  const { data, error, isLoading } = useSWR(url, (url) =>
    fetch(url).then((res) => res.json())
  );

  const updateInfo = useMemo(() => {
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
      return null;
    } else {
      const v = versions.at(-1);
      const zoteroSupports: (6 | 7)[] = [];
      console.log(v.applications.gecko?.strict_min_version, v.applications);
      if (
        v.applications.gecko &&
        v.applications.gecko.strict_min_version === "60.9"
      ) {
        zoteroSupports.push(6);
      }
      if (v.applications.zotero) {
        zoteroSupports.push(7);
      }
      return [v.version, v.update_link, zoteroSupports] as const;
    }
  }, [data]);

  return [
    isLoading
      ? Availablity.checking
      : error
      ? Availablity.unknown
      : updateInfo
      ? Availablity.yes
      : Availablity.no,
    updateInfo,
  ] as const;
};
