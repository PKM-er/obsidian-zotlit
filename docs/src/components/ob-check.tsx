/* eslint-disable react-hooks/rules-of-hooks */
import BrowserOnly from "@docusaurus/BrowserOnly";
import React from "react";
import {
  Availablity,
  AvailablityTag,
  mainManifest,
  useManifest,
  usePluginList,
} from "./available";

export default function ObsidianAvailable() {
  return (
    <BrowserOnly fallback={<span>{Availablity.checking}</span>}>
      {() => {
        const available = usePluginList();
        const [, versions] = useManifest(mainManifest);

        return <AvailablityTag available={available} versions={versions} />;
      }}
    </BrowserOnly>
  );
}
