import clsx from "clsx";
import React from "react";
import styles from "./available.module.css";

export default function LatestBadge({
  href,
  type,
  alt = "Latest Release",
}: {
  href: string;
  type: "obsidian" | "zotero";
  alt?: string;
}) {
  return (
    <a className={clsx(styles.badge)} href={href}>
      <img src={`/img/${type}-latest-badge.svg`} alt={alt} />
    </a>
  );
}
