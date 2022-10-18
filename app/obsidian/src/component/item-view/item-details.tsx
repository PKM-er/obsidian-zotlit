import { requiredKeys, getCreatorName } from "@obzt/zotero-type";
import type { GeneralItem, Annotation } from "@obzt/zotero-type";
import { atom, useAtom } from "jotai";
import { Menu, Notice } from "obsidian";
import React, { useEffect, useState } from "react";
import { JSONTree } from "react-json-tree";
import { GLOBAL_SCOPE } from "../atoms/utils";
import { useIconRef } from "../../utils/icon";

const queryDarkMode = () => document.body.hasClass("theme-dark");

const darkModeAtom = atom(queryDarkMode());

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

export const ItemDetails = ({
  item,
}: {
  item: GeneralItem | Annotation | null;
}) => {
  const [isDarkMode, setDarkMode] = useState(false);
  useEffect(() => {
    const listener = () => setDarkMode(queryDarkMode());
    app.workspace.on("css-change", listener);
    return () => app.workspace.off("css-change", listener);
  }, [setDarkMode]);
  if (!item) return <div>No Details Available</div>;
  return (
    <JSONTree
      data={item}
      labelRenderer={labelRenderer}
      theme={isDarkMode ? themeDark : themeLight}
      invertTheme={false}
      keyPath={["Zotero Item Data"]}
      shouldExpandNode={shouldExpandNode}
      getItemString={getItemString}
    />
  );
};

const shouldExpandNode = (
  keyPath: (string | number)[],
  data: unknown,
  level: number,
) => {
  if (keyPath[0] === "sortIndex") return false;
  if (
    level < 1 ||
    (keyPath[1] === "creators" && level < 2) ||
    (level < 2 && Array.isArray(data) && data.length > 1) ||
    keyPath[0] === "position"
  )
    return true;
  return false;
};
const CopyJSONIcon = () => {
  const [iconRef] = useIconRef<HTMLSpanElement>("clipboard-copy", 8);
  return <span ref={iconRef} />;
};
const getItemString = (
  _nodeType: string,
  data: unknown,
  itemType: React.ReactNode,
  itemString: string,
  keyPath: (string | number)[],
): React.ReactNode => {
  if (keyPath.length === 1) {
    const copy = async (
      evt:
        | React.MouseEvent<HTMLSpanElement>
        | React.KeyboardEvent<HTMLSpanElement>,
    ) => {
      evt.preventDefault();
      evt.stopPropagation();
      await navigator.clipboard.writeText(
        "```json\n" + JSON.stringify(data, null, 2) + "\n```",
      );
      new Notice("Copied JSON code block to clipboard");
    };

    return (
      <span
        role="button"
        tabIndex={0}
        onClick={copy}
        onKeyDown={copy}
        aria-label="Copy Item Details in JSON"
      >
        {itemString} <CopyJSONIcon />
      </span>
    );
  }
  if (keyPath[1] === "creators" && keyPath.length === 3) {
    const name = getCreatorName(data);
    if (name) {
      return <span>{name}</span>;
    }
  }
  if (keyPath[0] === "sortIndex" && keyPath.length === 2) {
    const sortIndex = data as number[];
    return <span>[{sortIndex.join(", ")}]</span>;
  }
  if (keyPath.length === 2 && Array.isArray(data) && data.length === 1) {
    return (
      <span>
        {itemType} {JSON.stringify(data[0])}
      </span>
    );
  }
  return (
    <span>
      {itemType} {itemString}
    </span>
  );
};
const getKeyName = (keyPath: (string | number)[]) =>
  keyPath
    .map((v) => {
      if (typeof v === "number" || v.includes("-") || v.includes(" "))
        return `[${v}]`;
      else return v;
    })
    .reverse()
    .join(".");
const labelRenderer = (
  keyPathWithRoot: (string | number)[],
  nodeType: string,
  _expanded: boolean,
  expandable: boolean,
): React.ReactNode => {
  const isRoot = keyPathWithRoot.length === 1;
  const keyPath = keyPathWithRoot.slice(0, -1);
  const path = getKeyName(keyPath);
  const handler = (evt: React.MouseEvent<HTMLSpanElement>) => {
    const menu = new Menu().addItem((i) =>
      i.setTitle("Copy Template").onClick(() => {
        navigator.clipboard.writeText("{{" + path + "}}");
      }),
    );

    if (expandable && nodeType !== "Array") {
      menu.addItem((i) =>
        i.setTitle("Copy Template (using {{#with}})").onClick(() => {
          navigator.clipboard.writeText(
            "{{#with " + path + "}}" + " " + "{{/with}}",
          );
        }),
      );
    }
    if (nodeType === "Array") {
      menu
        .addItem((i) =>
          i.setTitle("Copy Template (using {{#each}})").onClick(() => {
            navigator.clipboard.writeText(
              "{{#each " + path + "}}" + "{{this}}" + "{{/each}}",
            );
          }),
        )
        .addItem((i) =>
          i.setTitle("Copy Template (pick first element)").onClick(() => {
            navigator.clipboard.writeText("{{" + path + ".[0]}}");
          }),
        );
    }
    if (!requiredKeys.has(keyPath[0] as never)) {
      menu.addItem((i) =>
        i.setTitle("Copy Template (render when present)").onClick(() => {
          navigator.clipboard.writeText(
            "{{#if " + path + "}}" + "{{this}}" + "{{/if}}",
          );
        }),
      );
    }
    evt.preventDefault();
    menu.showAtMouseEvent(evt.nativeEvent);
  };

  const props = !isRoot
    ? {
        onContextMenu: handler,
        style: { cursor: "context-menu" },
      }
    : undefined;
  return <span {...props}>{keyPathWithRoot[0]}: </span>;
};
