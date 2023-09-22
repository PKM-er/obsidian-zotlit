// import { IframeWorkerHandler, WorkerPool } from "@aidenlx/workerpool";
import type { NoteInfo, RegularItemInfo } from "@obzt/database";
import { Service } from "@ophidian/core";
import { colord } from "colord";

// import workerCode from "worker:@/worker-iframe/note-parser/main";

// import type { NoteParserWorkerAPI } from "@/worker-iframe/note-parser/api";
import { nanoid } from "nanoid";
import log from "@/log";
import { getHelperExtraByAtch } from "@/note-feature/update-note";
import ZoteroPlugin from "@/zt-main";
import type { HelperExtra } from "../template/helper";
import colors from "../template/helper/colors.json";
import type { NoteNormailzed } from "../template/helper/item";
import { DataCitation, citationUri } from "./format";

declare global {
  // eslint-disable-next-line no-var, @typescript-eslint/naming-convention, @typescript-eslint/consistent-type-imports
  var TurndownService: typeof import("turndown");
}

// class NoteParserkWorker extends IframeWorkerHandler {
//   get code() {
//     return workerCode;
//   }
// }
// class NoteParserkWorkerPool extends WorkerPool<NoteParserWorkerAPI> {
//   workerCtor() {
//     return new NoteParserkWorker();
//   }
// }

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface Note extends NoteNormailzed {}
class Note {
  constructor(noteNormailzed: NoteNormailzed) {
    Object.assign(this, noteNormailzed);
  }
  toString() {
    return this.content;
  }
}

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

export class NoteParser extends Service {
  plugin = this.use(ZoteroPlugin);

  private citations = new Map<string, { text: string; itemKeys: string[] }>();
  tdService = new globalThis.TurndownService()
    .addRule("color", {
      filter: (node, _opts) => {
        return node.nodeName === "SPAN" && Boolean(node.style.color);
      },
      replacement: (content, node, _opts) => {
        if (!(node instanceof HTMLElement)) {
          throw new Error("Unexpected node");
        }
        const { color, colorName } = cssColorToHexName(node.style.color);

        const child = node.firstChild as HTMLSpanElement | null;
        if (
          child === node.lastChild &&
          child?.nodeName === "SPAN" &&
          Boolean(child.style.backgroundColor)
        ) {
          const { color: bgColor, colorName: bgColorName } = cssColorToHexName(
            child.style.backgroundColor,
          );
          return this.plugin.templateRenderer.renderColored({
            content,
            color,
            colorName,
            bgColor,
            bgColorName,
          });
        } else {
          return this.plugin.templateRenderer.renderColored({
            content,
            color,
            colorName,
            bgColor: null,
            bgColorName: null,
          });
        }
      },
    })
    .addRule("bg-color", {
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
        return this.plugin.templateRenderer.renderColored({
          content,
          color: null,
          colorName: null,
          bgColor,
          bgColorName,
        });
      },
    })
    .addRule("citation", {
      filter: (node, _opts) => {
        return node.classList.contains("citation") && !!node.dataset.citation;
      },
      replacement: (content, node, _opts) => {
        if (!(node instanceof HTMLElement)) {
          throw new Error("Unexpected node");
        }
        const _citation = JSON.parse(
          decodeURIComponent(node.dataset.citation!),
        );
        const { data: citation, problems } = DataCitation(_citation);
        if (problems) {
          log.error(`Unexpected citation data`, _citation, problems);
          throw new Error(`Unexpected citation data: ` + problems.summary);
        }
        const key = nanoid(10);
        this.citations.set(key, {
          text: content,
          itemKeys: citation.citationItems.map(
            ({ uris: [idUri] }) => idUri.match(citationUri)![1],
          ),
        });
        return `%%ZTNOTE.CITE:${key}%%`;
      },
    });
  domParser = new DOMParser();

  onload(): void {
    return;
  }

  async normalizeNotes(notes: NoteInfo[]): Promise<NoteNormailzed[]> {
    const normalized: NoteNormailzed[] = [];
    for (const { note, ...data } of notes) {
      normalized.push(
        new Note({
          ...data,
          content: note ? await this.turndown(note) : "",
          note,
        }),
      );
    }
    return normalized;
  }

  async turndown(html: string): Promise<string> {
    this.citations.clear();
    const markdown = this.tdService.turndown(html);
    const literatureKeys = [
      ...new Set([...this.citations.values()].flatMap((c) => c.itemKeys)),
    ];
    const items = await this.plugin.databaseAPI.getItems(
      literatureKeys.map((key) => [
        key,
        this.plugin.settings.database.citationLibrary,
      ]),
    );
    const itemByKey = new Map(
      (await this.toHelpers(items)).map((item, i) => [literatureKeys[i], item]),
    );
    const withCitations = markdown.replaceAll(
      /%%ZTNOTE\.CITE:([\w-]{10})%%/g,
      (_, key) => {
        const { itemKeys } = this.citations.get(key)!;
        const items = itemKeys
          .map((key) => itemByKey.get(key))
          .filter((v): v is HelperExtra => !!v);
        const citation = this.plugin.templateRenderer.renderCitations(items, {
          plugin: this.plugin,
        });
        return citation;
      },
    );
    this.citations.clear();
    return withCitations;
  }

  async toHelpers(items: (RegularItemInfo | null)[]) {
    const helpers: (HelperExtra | null)[] = [];
    const libId = this.plugin.database.settings.citationLibrary;

    for (const item of items) {
      if (item === null) {
        helpers.push(null);
        continue;
      }
      const helpersByAtch = await getHelperExtraByAtch(
        item,
        {
          all: await this.plugin.databaseAPI.getAttachments(item.itemID, libId),
          selected: [],
          notes: [],
        },
        this.plugin,
      );
      helpers.push(helpersByAtch[-1]);
    }
    return helpers;
  }
}
