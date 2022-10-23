import useIsBrowser from "@docusaurus/useIsBrowser";
import Admonition from "@theme/Admonition";
import clsx from "clsx";
import React, { useEffect, useState } from "react";
import { Availablity } from "./available";
import styles from "./available.module.css";

export const releaseURL =
  "https://raw.githubusercontent.com/aidenlx/obsidian-zotero/aidenlx/master/app/zotero/update.rdf";

export type ZoteroInfo = [version: string, updateLink: string];

export const ZtInfo = ({ info }: { info: ZoteroInfo }) => {
  if (!info) return null;
  const [version, updateLink] = info;
  return (
    <Admonition type="info">
      <div>
        Latest Version:
        <code className={clsx(styles.version)}>{version}</code>
      </div>
      <div>
        Download Link:
        <a className={clsx(styles.badge)} href={updateLink}>
          <img src="/img/zotero-download-badge.svg" alt="Latest Release" />
        </a>
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
      .then((res) => (res.ok ? res.text() : null))
      .then((xml) => {
        if (!xml) {
          setInfo(null);
          setAvailable(Availablity.no);
        } else {
          const parser = new DOMParser();
          const doc = parser.parseFromString(xml, "application/xml");
          const version = doc.getElementsByTagNameNS(
              "http://www.mozilla.org/2004/em-rdf#",
              "version",
            )[0].textContent,
            updateLink = doc.getElementsByTagNameNS(
              "http://www.mozilla.org/2004/em-rdf#",
              "updateLink",
            )[0].textContent;
          setAvailable(Availablity.yes);

          setInfo([version, updateLink]);
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
