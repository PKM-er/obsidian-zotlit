/* eslint-disable react-hooks/rules-of-hooks */
import React from "react";
import { AvailablityTag } from "./available";
import { releaseURL, useUpdateRDF, ZtInfo } from "./zotero";

export default function ZoteroDownload() {
  const [available, info] = useUpdateRDF(releaseURL);
  return (
    <AvailablityTag available={available} info={info} infoComponent={ZtInfo} />
  );
}
