import { useEffect, useState } from "react";
import { JSONTree } from "react-json-tree";
import { getItemString } from "./getItemString";
import { labelRenderer } from "./labelRenderer";
import { shouldExpandNode } from "./shouldExpandNode";
import { valueRenderer } from "./valueRenderer";

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

export default function ItemDetails({
  item,
  registerCssChange,
}: {
  item: any;
  registerCssChange?: (callback: () => void) => () => void;
}) {
  const [isDarkMode, setDarkMode] = useState(false);

  useEffect(
    () => registerCssChange?.(() => setDarkMode(queryDarkMode())),
    [registerCssChange],
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
      labelRenderer={labelRenderer}
      getItemString={getItemString}
    />
  );
}
