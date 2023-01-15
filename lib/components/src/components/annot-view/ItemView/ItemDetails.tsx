import { AnnotationType, TagType } from "@obzt/zotero-type";
import React, { useContext, useEffect, useState } from "react";
import type { ShouldExpandNodeInitially, ValueRenderer } from "react-json-tree";
import { JSONTree } from "react-json-tree";
import { Obsidian } from "../context";

const queryDarkMode = () => document.body.classList.contains("theme-dark");

const themeLight = {
  scheme: "Solarized Light",
  author: "Ethan Schoonover (modified by aramisgithub)",
  base00: "#fdf6e3",
  base01: "#eee8d5",
  base02: "#93a1a1",
  base03: "#839496",
  base04: "#657b83",
  base05: "#586e75",
  base06: "#073642",
  base07: "#002b36",
  base08: "#dc322f",
  base09: "#cb4b16",
  base0A: "#b58900",
  base0B: "#859900",
  base0C: "#2aa198",
  base0D: "#268bd2",
  base0E: "#6c71c4",
  base0F: "#d33682",
};

const themeDark = {
  scheme: "Solarized Dark",
  author: "Ethan Schoonover (modified by aramisgithub)",
  base00: "#002b36",
  base01: "#073642",
  base02: "#586e75",
  base03: "#657b83",
  base04: "#839496",
  base05: "#93a1a1",
  base06: "#eee8d5",
  base07: "#fdf6e3",
  base08: "#dc322f",
  base09: "#cb4b16",
  base0A: "#b58900",
  base0B: "#859900",
  base0C: "#2aa198",
  base0D: "#268bd2",
  base0E: "#6c71c4",
  base0F: "#d33682",
};

// matches #RGB, #RGBA, #RRGGBB, #RRGGBBAA
const hex = /^#(?:[\dA-F]{3}){1,2}$|^#(?:[\dA-F]{4}){1,2}$/i;

export default function ItemDetails({ item }: { item: any }) {
  const [isDarkMode, setDarkMode] = useState(false);
  const { registerCssChange, itemDetailsProps } = useContext(Obsidian);

  useEffect(
    () => registerCssChange(() => setDarkMode(queryDarkMode())),
    [setDarkMode, registerCssChange],
  );
  if (!item) return <div>No Details Available</div>;
  return (
    <JSONTree
      data={item}
      theme={isDarkMode ? themeDark : themeLight}
      invertTheme={false}
      keyPath={["Zotero Item Data"]}
      shouldExpandNodeInitially={shouldExpandNode}
      valueRenderer={valueRenderer}
      {...itemDetailsProps}
    />
  );
}

/** @see https://stackoverflow.com/a/41491220 */
const shouldBlack = (bgHex: string) => {
  const color = bgHex.charAt(0) === "#" ? bgHex.substring(1, 7) : bgHex;
  const r = parseInt(color.substring(0, 2), 16); // hexToR
  const g = parseInt(color.substring(2, 4), 16); // hexToG
  const b = parseInt(color.substring(4, 6), 16); // hexToB
  return r * 0.299 + g * 0.587 + b * 0.114 > 186;
};

const valueRenderer: ValueRenderer = (
  valueAsString: unknown,
  value: unknown,
  ...keyPath: (string | number)[]
): React.ReactNode => {
  if (typeof value === "string" && hex.test(value)) {
    return (
      <span
        style={{
          backgroundColor: value,
          padding: "0 0.5em",
          color: shouldBlack(value) ? "black" : "white",
        }}
      >
        {value}
      </span>
    );
  }
  if (keyPath[0] === "type" && typeof value === "number") {
    let type = "";
    if (keyPath.length === 2 && AnnotationType[value]) {
      type = AnnotationType[value];
    } else if (
      keyPath.length === 4 &&
      typeof keyPath[1] === "number" &&
      keyPath[2] === "tags" &&
      TagType[value]
    ) {
      type = TagType[value];
    }
    if (type) {
      return (
        <>
          {valueAsString} <span>({type})</span>
        </>
      );
    }
  }
  return valueAsString;
};

const neverExpand = new Set(["sortIndex"]),
  noExpandIfLarge = new Set(["creators", "tags"]),
  alwaysExpand = new Set(["position"]);
const shouldExpandNode: ShouldExpandNodeInitially = (
  keyPath: readonly (string | number)[],
  data: unknown,
  level: number,
) => {
  const first = keyPath[0] as never;
  if (
    neverExpand.has(first) ||
    (noExpandIfLarge.has(first) && Array.isArray(data) && data.length > 6)
  )
    return false;
  if (
    alwaysExpand.has(first) ||
    level < 1 ||
    (level < 2 && Array.isArray(data) && data.length > 1)
  )
    return true;
  return false;
};
