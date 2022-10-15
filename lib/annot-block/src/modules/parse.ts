/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { Content, Link, Paragraph } from "mdast";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { selectAll } from "unist-util-select";
import type { AnnotBlockWorkerAPI, AnnotInfo } from "../api";

const parser = unified().use(remarkParse).freeze();

const parse: AnnotBlockWorkerAPI["parse"] = (markdown) => {
  const ast = parser.parse(markdown);
  const links = (
    selectAll("blockquote > paragraph link", ast) as Required<Link>[]
  ).filter(({ url }) => {
    // exclude links that doesn't link to zotero annotation
    try {
      const link = new URL(url);
      return link.protocol === "zotero:" && link.searchParams.has("annotation");
    } catch {
      return false;
    }
  });

  const paragraphs = selectAll(
    "blockquote > paragraph",
    ast,
  ) as Required<Paragraph>[];

  const fallbacks = new Map<Link, string>();
  for (const { children } of paragraphs) {
    let cache = "";
    for (const node of children) {
      if (node.type === "text") {
        cache += node.value;
      } else if (node.type === "link") {
        fallbacks.set(node, cache.replace(/\n+/g, " ").trim());
        cache = "";
      } else {
        const { start, end } = node.position!;
        cache += markdown.slice(start.offset!, end.offset!);
      }
    }
  }

  const withoutLinks = filterRanges(
    markdown,
    links.map(({ position: { start, end } }) => [start.offset!, end.offset!]),
  );
  const annots: AnnotInfo[] = links.map((link) => {
    const { url, children } = link;
    const first = children[0],
      last = children[children.length - 1];
    const base = {
      annotKey: new URL(url).searchParams.get("annotation")!,
      url,
      fallback: fallbacks.get(link) ?? "",
    };
    if (children.length === 1 && first.type === "inlineCode" && first.value) {
      // if link text is one inline code
      return {
        ...base,
        alt: first.value,
        altType: "code",
      };
    } else if (
      children.length > 0 &&
      first.type === "text" &&
      first.value.startsWith("%%") &&
      last.type === "text" &&
      last.value.endsWith("%%")
    ) {
      // if link text is wrapped by %% (e.g. %%raw.title%%)
      return {
        ...base,
        alt: getChildrenText(markdown, children).slice(2, -2),
        altType: "text",
      };
    } else {
      return {
        ...base,
        alt: getChildrenText(markdown, children),
        altType: "none",
      };
    }
  });
  return { annots, withoutLinks };
};

export default parse;

const filterRanges = (text: string, ranges: [number, number][]) => {
  let offset = 0;
  for (const [start, end] of ranges) {
    text = text.slice(0, start + offset) + text.slice(end + offset);
    offset += start - end;
  }
  return text;
};

const getChildrenText = (text: string, children: Content[]) => {
  if (children.length === 0) return "";
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const start = children[0].position!.start.offset!,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    end = children[children.length - 1].position!.end.offset!;
  return text.slice(start, end);
};
