import type { ObsidianContext } from "@obzt/components";
import type { TagInfo } from "@obzt/database";
import { getCreatorName, requiredKeys } from "@obzt/database";
import { TagType } from "@obzt/zotero-type";
import endent from "endent";
import { Menu, Notice } from "obsidian";
import type { KeyboardEvent, MouseEvent } from "react";
import { useIconRef } from "../../utils/icon";

const CopyJSONIcon = () => {
  const [iconRef] = useIconRef<HTMLSpanElement>("clipboard-copy");
  return <span ref={iconRef} />;
};

export const itemDetailsProps: ObsidianContext["itemDetailsProps"] = {
  getItemString(_nodeType, data, itemType, itemString, keyPath) {
    if (keyPath.length === 1) {
      const copy = async (
        evt: MouseEvent<HTMLSpanElement> | KeyboardEvent<HTMLSpanElement>,
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
    if (keyPath[1] === "tags" && keyPath.length === 3) {
      const tag = data as TagInfo;
      return (
        <span>
          "{tag.name}"" ({TagType[tag.type]})
        </span>
      );
    }
    if (keyPath[0] === "sortIndex" && keyPath.length === 2) {
      const sortIndex = data as number[];
      return <span>[{sortIndex.join(", ")}]</span>;
    }
    if (keyPath.length === 2 && Array.isArray(data) && data.length === 1) {
      // show first item of array if it contains only one
      const text = JSON.stringify(data[0]);
      return (
        <span>
          {itemType} {text.length > 100 ? text.slice(0, 100) + "..." : text}
        </span>
      );
    }
    return (
      <span>
        {itemType} {itemString}
      </span>
    );
  },
  labelRenderer(keyPathWithRoot, nodeType, _expanded, expandable) {
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
  },
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
