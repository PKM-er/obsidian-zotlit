import { requiredKeys } from "@obzt/database";
import endent from "endent";
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

const getKeyName = (keyPath: (string | number)[]) =>
  "it" + keyPath.map(toPropName).reverse().join("");

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Lexical_grammar#identifiers
const identifiers = /^[$_\p{ID_Start}][$\u200c\u200d\p{ID_Continue}]*$/u;
const toPropName = (key: string | number) => {
  if (typeof key === "number") return `[${key}]`;
  if (identifiers.test(key)) return `.${key}`;
  return `[${JSON.stringify(key)}]`;
};
