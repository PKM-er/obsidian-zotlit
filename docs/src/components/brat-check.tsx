/* eslint-disable react-hooks/rules-of-hooks */
import BrowserOnly from "@docusaurus/BrowserOnly";
import React, { useState, useEffect } from "react";
import { Availablity, AvailablityTag } from "./available";

export default function BRATAvailable() {
  return (
    <BrowserOnly fallback={<span>{Availablity.checking}</span>}>
      {() => {
        const [available, setAvailable] = useState(Availablity.checking);
        useEffect(() => {
          fetch(
            "https://raw.githubusercontent.com/aidenlx/obsidian-zotero/master/manifest-beta.json",
          )
            .then((res) => {
              if (res.ok) {
                setAvailable(Availablity.yes);
              } else {
                setAvailable(Availablity.no);
              }
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
