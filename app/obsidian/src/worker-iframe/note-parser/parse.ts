/* eslint-disable @typescript-eslint/naming-convention */
import { scope } from "arktype";
import { nanoid } from "nanoid";
import type TurndownService from "turndown";

declare global {
  // eslint-disable-next-line no-var, @typescript-eslint/naming-convention, @typescript-eslint/consistent-type-imports
  var TurndownService: typeof import("turndown");
}

await importScripts("lib/turndown.js");

const config: TurndownService.Options = {};

// uri like http://zotero.org/users/6775115/items/C689D5Q2
const citationUri = /^https?:\/\/zotero\.org\/.*\/items\/([A-Z\d]+)$/;

const { DataCitation } = scope({
  CitationItem: {
    uris: [citationUri],
  },
  DataCitation: {
    citationItems: "CitationItem[]",
    properties: "any",
  },
}).compile();

const tdService = new globalThis.TurndownService(config);
const domParser = new DOMParser();

export default function parse(html: string) {
  const doc = domParser.parseFromString(html, "text/html");
  const container = doc.querySelector<HTMLDivElement>(".zotero-note > div");
  if (!container) {
    console.error("Failed to parse note, no container found");
    return null;
  }
  const citations: { text: string; itemKeys: string[]; key: string }[] = [];
  const colored: { color: string; key: string }[] = [];
  const { schemaVersion /* , citationItems: _citationItems */ } =
    container.dataset;
  // citationItems = _citationItems
  //   ? JSON.parse(decodeURIComponent(_citationItems))
  //   : null;
  if (schemaVersion !== "9") {
    console.warn("Unsupported schema version", schemaVersion);
  }
  delete container.dataset.citationItems;
  for (const el of doc.getElementsByClassName("citation")) {
    if (!(el instanceof HTMLSpanElement)) {
      console.error("Unexpected element", el.outerHTML);
      continue;
    }
    const { citation: _citation } = el.dataset;
    if (!_citation) {
      console.error("Missing citation data", el.outerHTML);
      continue;
    }
    const _citationData = JSON.parse(decodeURIComponent(_citation));
    const { data: citation, problems } = DataCitation(_citationData);
    if (problems) {
      console.error(`Unexpected citation data`, _citationData, problems);
      continue;
    }

    const key = nanoid(10);
    citations.push({
      text:
        el.getElementsByClassName("citation-item")[0]?.textContent ??
        el.textContent ??
        "",
      key,
      itemKeys: citation.citationItems.map(
        ({ uris: [idUri] }) => idUri.match(citationUri)![1],
      ),
    });
    el.textContent = `%%ZTNOTE.CITE:${key}%%`;
  }
  for (const el of iterateColored(container)) {
    const key = nanoid(10);
    colored.push({
      color: el.style.backgroundColor,
      key,
    });
    el.insertAdjacentText("afterbegin", `%%COLOR.BEGIN:${key}%%`);
    el.insertAdjacentText("beforeend", `%%COLOR.END:${key}%%`);
  }
  return {
    content: tdService.turndown(doc),
    colored,
    citations,
  };
}

function* iterateColored(container: HTMLElement) {
  const iterator = document.createNodeIterator(
    container,
    NodeFilter.SHOW_ELEMENT,
    {
      acceptNode: (node) => {
        if (node instanceof HTMLSpanElement && node.style.backgroundColor) {
          return NodeFilter.FILTER_ACCEPT;
        }
        return NodeFilter.FILTER_SKIP;
      },
    },
  );

  let currentNode: Node | null = null;
  while ((currentNode = iterator.nextNode())) {
    yield currentNode as HTMLSpanElement;
  }
}
