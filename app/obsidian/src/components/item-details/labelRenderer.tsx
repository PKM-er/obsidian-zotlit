import { requiredKeys } from "@obzt/database";
import { Menu } from "obsidian";
import type { MouseEvent } from "react";
import type { LabelRenderer } from "react-json-tree";

export const labelRenderer: LabelRenderer = (
  keyPathWithRoot,
  nodeType,
  _expanded,
  expandable,
) => {
  const isRoot = keyPathWithRoot.length === 1;
  const keyPath = keyPathWithRoot.slice(0, -1);
  const path = getKeyName(keyPath);
  const handler = (evt: MouseEvent<HTMLSpanElement>) => {
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
          const key = getKeyName(rest);
          navigator.clipboard.writeText(
            `<% { const { ${destruct}: $it } = ${key}; %>\n  <%= $it %>\n<% } %>`,
          );
        }),
      );
    }
    if (nodeType === "Array") {
      menu
        .addItem((i) =>
          i.setTitle("Copy Template (using for-of loop)").onClick(() => {
            navigator.clipboard.writeText(
              `<% for (const $it of ${path}) { %>\n  <%= $it %>\n<% } %>`,
            );
          }),
        )
        .addItem((i) =>
          i.setTitle("Copy Template (using forEach)").onClick(() => {
            navigator.clipboard.writeText(
              `<% ${path}.forEach(($it, i) => { %>\n  <%= $it %>\n<% }) %>`,
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
            `<% if ${path} { %>\n  <%= ${path} %>\n<% } %>`,
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

const getKeyName = (keyPath: (string | number)[]) =>
  "it" + keyPath.map(toPropName).reverse().join("");

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Lexical_grammar#identifiers
const identifiers = /^[$_\p{ID_Start}][$\u200c\u200d\p{ID_Continue}]*$/u;
const toPropName = (key: string | number) => {
  if (typeof key === "number") return `[${key}]`;
  if (identifiers.test(key)) return `.${key}`;
  return `[${JSON.stringify(key)}]`;
};
