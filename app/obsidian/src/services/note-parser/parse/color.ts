import { colord } from "colord";
import type { Rule } from "turndown";

export const color = (renderer: TemplateRenderer): Rule => ({
  filter: (node, _opts) => {
    return node.nodeName === "SPAN" && Boolean(node.style.color);
  },
  replacement: (content, node, _opts) => {
    if (!(node instanceof HTMLElement)) {
      throw new Error("Unexpected node");
    }
    const { color, colorName } = cssColorToHexName(node.style.color);

    const child = node.firstChild as HTMLSpanElement | null;
    let bgColors: {
      bgColor: string | null;
      bgColorName: string | null;
    } = {
      bgColor: null,
      bgColorName: null,
    };
    if (
      child === node.lastChild &&
      child?.nodeName === "SPAN" &&
      Boolean(child.style.backgroundColor)
    ) {
      const { color: bgColor, colorName: bgColorName } = cssColorToHexName(
        child.style.backgroundColor,
      );
      bgColors = {
        bgColor,
        bgColorName,
      };
    }
    {
      return renderer.renderColored({ content, color, colorName, ...bgColors });
    }
  },
});
export const bgColor = (renderer: TemplateRenderer): Rule => ({
  filter: (node, _opts) => {
    return node.nodeName === "SPAN" && Boolean(node.style.backgroundColor);
  },
  replacement: (content, node, _opts) => {
    if (!(node instanceof HTMLElement)) {
      throw new Error("Unexpected node");
    }
    const { color: bgColor, colorName: bgColorName } = cssColorToHexName(
      node.style.backgroundColor,
    );
    const parent = node.parentElement as HTMLSpanElement | null;
    if (
      parent?.nodeName === "SPAN" &&
      Boolean(parent.style.color) &&
      !node.nextSibling
    ) {
      // nested color are handled by color rule
      return content;
    }
    return renderer.renderColored({
      content,
      color: null,
      colorName: null,
      bgColor,
      bgColorName,
    });
  },
});

import type { TemplateRenderer } from "@/services/template";
import colors from "@/services/template/helper/colors.json";

function cssColorToHexName(code: string) {
  if (!code)
    return {
      colorName: null,
      color: null,
    };
  const hex = colord(code).toHex().toUpperCase();
  const name = colors[hex.substring(0, 7) as keyof typeof colors];
  return {
    colorName: name ?? hex,
    color: hex,
  };
}
