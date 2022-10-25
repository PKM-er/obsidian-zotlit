import { useColorMode } from "@docusaurus/theme-common";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Giscus from "@giscus/react";
import Paginator from "@theme-original/DocItem/Paginator";
import React from "react";

export default function PaginatorWrapper(props) {
  const { colorMode } = useColorMode();
  const {
    i18n: { currentLocale },
  } = useDocusaurusContext();

  // convert to locale code giscus supports
  // https://github.com/giscus/giscus/tree/main/locales
  const lang =
    currentLocale === "zh-Hans"
      ? "zh-CN"
      : currentLocale === "zh-Hant"
      ? "zh-TW"
      : currentLocale;
  return (
    <>
      <Paginator {...props} />
      <Giscus
        repo="aidenlx/obsidian-zotero"
        repoId="R_kgDOGy2_uA"
        category="Docs Comments"
        categoryId="DIC_kwDOGy2_uM4CSEbI"
        mapping="pathname"
        strict="1"
        reactionsEnabled="1"
        emitMetadata="0"
        inputPosition="top"
        theme={colorMode}
        lang={lang}
        loading="lazy"
      />
    </>
  );
}
