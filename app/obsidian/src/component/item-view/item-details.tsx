/* eslint-disable @typescript-eslint/no-explicit-any */
import { requiredKeys, getCreatorName } from "@obzt/zotero-type";
import endent from "endent";
import { Menu, Notice } from "obsidian";
import React, { useEffect, useState } from "react";
import { JSONTree } from "react-json-tree";
import { useIconRef } from "../../utils/icon";

const queryDarkMode = () => document.body.hasClass("theme-dark");

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

export const ItemDetails = ({ item }: { item: any }) => {
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
      valueRenderer={valueRenderer}
    />
  );
};

/** @see https://stackoverflow.com/a/41491220 */
const shouldBlack = (bgHex: string) => {
  const color = bgHex.charAt(0) === "#" ? bgHex.substring(1, 7) : bgHex;
  const r = parseInt(color.substring(0, 2), 16); // hexToR
  const g = parseInt(color.substring(2, 4), 16); // hexToG
  const b = parseInt(color.substring(4, 6), 16); // hexToB
  return r * 0.299 + g * 0.587 + b * 0.114 > 186;
};

const valueRenderer = (
  valueAsString: string,
  value: unknown,
  ..._keyPath: (string | number)[]
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
  return valueAsString;
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
  "it" + keyPath.map(toPropName).reverse().join("");
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
        navigator.clipboard.writeText(`<%= ${path} %>`);
      }),
    );

    if (expandable && nodeType !== "Array") {
      menu.addItem((i) =>
        i.setTitle("Copy Template (using with)").onClick(() => {
          const [toPick, ...rest] = keyPath;
          const destruct =
            typeof toPick === "string" && identifiers.test(toPick)
              ? toPick
              : `'${toPick}'`;
          navigator.clipboard.writeText(endent`
          <% { const { ${destruct}: $it } = ${getKeyName(rest)}; %>
            <%= $it %>
          <% } %>`);
        }),
      );
    }
    if (nodeType === "Array") {
      menu
        .addItem((i) =>
          i.setTitle("Copy Template (using for-of loop)").onClick(() => {
            navigator.clipboard.writeText(
              endent`
              <% for (const $it of ${path}) { %>
                <%= $it %>
              <% } %>`,
            );
          }),
        )
        .addItem((i) =>
          i.setTitle("Copy Template (using forEach)").onClick(() => {
            navigator.clipboard.writeText(
              endent`
              <% ${path}.forEach(($it, i) => { %>
                <%= $it %>
              <% }) %>`,
            );
          }),
        )
        .addItem((i) =>
          i.setTitle("Copy Template (pick first element)").onClick(() => {
            navigator.clipboard.writeText(`<%= ${path}.first() %>`);
          }),
        )
        .addItem((i) =>
          i.setTitle("Copy Template (pick last element)").onClick(() => {
            navigator.clipboard.writeText(`<%= ${path}.last() %>`);
          }),
        );
    }
    if (!requiredKeys.has(keyPath[0] as never)) {
      menu.addItem((i) =>
        i.setTitle("Copy Template (render when present)").onClick(() => {
          navigator.clipboard.writeText(
            endent`
            <% if ${path} { %>
              <%= ${path} %>
            <% } %>`,
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

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Lexical_grammar#identifiers
const identifiers = /^[$_\p{ID_Start}][$\u200c\u200d\p{ID_Continue}]*$/u;
const toPropName = (key: string | number) => {
  if (typeof key === "number") return `[${key}]`;
  if (identifiers.test(key)) return `.${key}`;
  return `[${JSON.stringify(key)}]`;
};
