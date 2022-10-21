/* eslint-disable react-hooks/rules-of-hooks */
import BrowserOnly from "@docusaurus/BrowserOnly";
import React, { useState, useEffect } from "react";
import { Availablity, AvailablityTag } from "./available";

export default function ObsidianAvailable() {
  return (
    <BrowserOnly fallback={<span>{Availablity.checking}</span>}>
      {() => {
        const [available, setAvailable] = useState(Availablity.checking);
        useEffect(() => {
          fetch(
            "https://raw.githubusercontent.com/obsidianmd/obsidian-releases/master/community-plugins.json",
          )
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
        }, []);
        return <AvailablityTag available={available} />;
      }}
    </BrowserOnly>
  );
}
