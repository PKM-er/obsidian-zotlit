/* eslint-disable react-hooks/rules-of-hooks */
import BrowserOnly from "@docusaurus/BrowserOnly";
import React from "react";
import { Availablity, AvailablityTag } from "./available";
import { releaseURL, useUpdateRDF, ZtInfo } from "./zotero";

export default function ZoteroDownload() {
  return (
    <BrowserOnly fallback={<span>{Availablity.checking}</span>}>
      {() => {
        const [available, info] = useUpdateRDF(releaseURL);
        return (
          <AvailablityTag
            available={available}
            info={info}
            infoComponent={ZtInfo}
          />
        );
      }}
    </BrowserOnly>
  );
}
