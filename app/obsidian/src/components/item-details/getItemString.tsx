import type { TagInfo } from "@obzt/database";
import { getCreatorName } from "@obzt/database";
import { TagType } from "@obzt/zotero-type";
import { Notice } from "obsidian";
import type { KeyboardEvent, MouseEvent } from "react";

import type { GetItemString } from "react-json-tree";
import { useIconRef } from "@/utils/icon";

const CopyJSONIcon = () => {
  const [iconRef] = useIconRef<HTMLSpanElement>("clipboard-copy");
  return <span ref={iconRef} />;
};

export const getItemString: GetItemString = (
  _nodeType,
  data,
  itemType,
  itemString,
  keyPath,
) => {
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
        aria-label="Copy item details in JSON"
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
};
