import { AnnotationType, TagType } from "@obzt/zotero-type";
import React from "react";
import type { ValueRenderer } from "react-json-tree";

// matches #RGB, #RGBA, #RRGGBB, #RRGGBBAA
const hex = /^#(?:[\dA-F]{3}){1,2}$|^#(?:[\dA-F]{4}){1,2}$/i;

/** @see https://stackoverflow.com/a/41491220 */
const shouldBlack = (bgHex: string) => {
  const color = bgHex.charAt(0) === "#" ? bgHex.substring(1, 7) : bgHex;
  const r = parseInt(color.substring(0, 2), 16); // hexToR
  const g = parseInt(color.substring(2, 4), 16); // hexToG
  const b = parseInt(color.substring(4, 6), 16); // hexToB
  return r * 0.299 + g * 0.587 + b * 0.114 > 186;
};
export const valueRenderer: ValueRenderer = (
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
