import type {
  AnnotationInfo,
  AttachmentInfo,
  NoteInfo,
  RegularItemInfo,
} from "@obzt/database";
import { Service } from "@ophidian/core";

import { nanoid } from "nanoid";
import { htmlToMarkdown } from "obsidian";
import log from "@/log";
import ZoteroPlugin from "@/zt-main";
import type { HelperExtra } from "../template/helper";
import type { NoteNormailzed } from "../template/helper/item";
import { DataAnnotation, DataCitation, keyFromItemURI } from "./format";
import { bgColor, color } from "./parse/color";

declare global {
  // eslint-disable-next-line no-var, @typescript-eslint/naming-convention, @typescript-eslint/consistent-type-imports
  var TurndownService: typeof import("turndown");
}

// eslint-disable-next-line @typescript-eslint/naming-convention
const Placeholder = {
  cite: {
    pattern: /%%ZTNOTE\.CITE:([\w-]{10})%%/g,
    create: (key: string) => `%%ZTNOTE.CITE:${key}%%`,
  },
  annot: {
    pattern: /%%ZTNOTE\.ANNOT:([\w-]{10})%%/g,
    create: (key: string) => `%%ZTNOTE.ANNOT:${key}%%`,
  },
};

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

export class NoteParser extends Service {
  plugin = this.use(ZoteroPlugin);

  private citations = new Map<string, { text: string; itemKeys: string[] }>();
  private annotations = new Map<
    string,
    {
      commentHTML: string | null;
      annotationKey: string;
      citationKey: string;
      attachementKey: string;
      inline: boolean;
    }
  >();
  tdService = new globalThis.TurndownService({ headingStyle: "atx" })
    .addRule("color", color(this.plugin.templateRenderer))
    .addRule("bg-color", bgColor(this.plugin.templateRenderer))
    .addRule("highlight-imported", {
      filter: (node, _opts) => {
        if (node.tagName !== "P") return false;
        const [first, second, third] = node.childNodes;
        if (
          !(
            first instanceof HTMLElement &&
            first.classList.contains("highlight")
          )
        )
          return false;
        if (second instanceof HTMLElement) {
          return second.classList.contains("citation");
        }
        if (second instanceof Text && second.textContent?.trim() === "") {
          return (
            third instanceof HTMLElement && third.classList.contains("citation")
          );
        }
        return false;
      },
      replacement: (_content, node, _opts) => {
        const [highlightEl, citationEl] = node.children;
        // remove every children of node before citataion element and citation element itself
        while (node.firstChild !== citationEl) {
          node.removeChild(node.firstChild!);
        }
        node.removeChild(citationEl);
        const annotation = parseAnnotation(
          (highlightEl as HTMLElement).dataset.annotation!,
        );
        const commentNode = node as HTMLElement;
        const key = nanoid(10);
        this.annotations.set(key, {
          annotationKey: annotation.annotationKey,
          citationKey: keyFromItemURI(annotation.citationItem.uris[0])!,
          attachementKey: keyFromItemURI(annotation.attachmentURI)!,
          commentHTML: commentNode.textContent?.trim()
            ? commentNode.innerHTML
            : null,
          inline: false,
        });
        return Placeholder.annot.create(key);
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
        const citation = parseCitation(node.dataset.citation!);
        const key = nanoid(10);
        this.citations.set(key, {
          text: content,
          itemKeys: citation.citationItems.map(
            ({ uris: [idUri] }) => keyFromItemURI(idUri)!,
          ),
        });
        return Placeholder.cite.create(key);
      },
    })
    .addRule("highlight", {
      filter: (node, _opts) => {
        return (
          node.classList.contains("highlight") && !!node.dataset.annotation
        );
      },
      replacement: (content, node, _opts) => {
        if (!(node instanceof HTMLElement)) {
          throw new Error("Unexpected node");
        }
        const annotation = parseAnnotation(node.dataset.annotation!);
        const key = nanoid(10);
        this.annotations.set(key, {
          annotationKey: annotation.annotationKey,
          citationKey: keyFromItemURI(annotation.citationItem.uris[0])!,
          attachementKey: keyFromItemURI(annotation.attachmentURI)!,
          commentHTML: null,
          inline: true,
        });
        return Placeholder.annot.create(key);
      },
    });

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
    this.annotations.clear();
    const markdown = this.tdService.turndown(html);
    const keyFrom = {
      citations: [...this.citations.values()].flatMap((c) => c.itemKeys),
      annotations: [...this.annotations.values()].map((a) => a.citationKey),
    };
    const attachmentWithAnnotation = new Set(
      [...this.annotations.values()].map((v) => v.attachementKey),
    );
    const libId = this.plugin.settings.libId;

    const literatureKeys = uniq([...keyFrom.citations, ...keyFrom.annotations]);
    const docItems = await this.plugin.databaseAPI
      .getItems(literatureKeys.map((key) => [key, libId]))
      .then(async (itemList) => {
        const items = new Map<
          string,
          {
            item: RegularItemInfo;
            attachments: AttachmentInfo[];
            annotations: Map<string, AnnotationInfo>;
          } | null
        >();
        for (let i = 0; i < literatureKeys.length; i++) {
          const key = literatureKeys[i];
          const docItem = itemList[i];
          if (docItem === null) {
            items.set(key, null);
            continue;
          }
          const attachments = await this.plugin.databaseAPI.getAttachments(
            docItem.itemID,
            libId,
          );
          const annotations = new Map<string, AnnotationInfo>();
          for (const attachment of attachments) {
            if (!attachmentWithAnnotation.has(attachment.key)) continue;
            const annots = await this.plugin.databaseAPI.getAnnotations(
              attachment.itemID,
              libId,
            );
            for (const annot of annots) {
              annotations.set(annot.key, annot);
            }
          }
          items.set(key, {
            item: docItem,
            attachments,
            annotations,
          });
        }
        return items;
      });
    const tags = await this.plugin.databaseAPI.getTags(
      [...docItems.values()]
        .flatMap((v) =>
          v
            ? [
                v.item.itemID,
                ...[...v.annotations.values()].map((a) => a.itemID),
              ]
            : [],
        )
        .map((id) => [id, libId]),
    );

    const parsed = markdown
      .replaceAll(Placeholder.cite.pattern, (_, key) => {
        const citeData = this.citations.get(key)!;
        const items = citeData.itemKeys.map((key) => {
          const item = docItems.get(key);
          if (!item) {
            log.error(`citation not found, key: `, key, citeData);
            throw new Error(`citation not found: key ${key}`);
          }
          return {
            allAttachments: item.attachments,
            annotations: [],
            docItem: item.item,
            attachment: null,
            tags,
            notes: [],
          } as HelperExtra;
        });

        const citation = this.plugin.templateRenderer.renderCitations(items, {
          plugin: this.plugin,
        });
        return citation;
      })
      .replaceAll(Placeholder.annot.pattern, (_, key) => {
        const annotData = this.annotations.get(key)!;
        const docItem = docItems.get(annotData.citationKey);
        if (!docItem) {
          log.error(`citation not found, key:`, key, annotData);
          throw new Error(`citation key not found: ${key}`);
        }
        const annotation = docItem.annotations.get(annotData.annotationKey);
        if (!annotation) {
          log.error(
            `annotation not found, key: `,
            annotData.annotationKey,
            annotData,
          );
          throw new Error(
            `annotation key not found: ${annotData.annotationKey}`,
          );
        }
        const markdown = this.plugin.templateRenderer.renderAnnot(
          {
            ...annotation,
            ztnote: {
              comment: annotData.commentHTML,
              get commentMd(): string {
                if (annotData.commentHTML) {
                  return htmlToMarkdown(annotData.commentHTML);
                } else return "";
              },
              inline: annotData.inline,
            },
          },
          {
            allAttachments: docItem.attachments,
            annotations: [...docItem.annotations.values()],
            attachment: docItem.attachments.find(
              (atch) => atch.itemID === annotation.parentItemID,
            )!,
            docItem: docItem.item,
            notes: [],
            tags,
          },
          { plugin: this.plugin },
        );
        if (!annotData.inline) {
          return "\n" + markdown + "\n";
        }
        return markdown;
      })
      .replace(/\n{3,}/g, "\n\n");
    this.citations.clear();
    this.annotations.clear();
    return parsed;
  }
}

function parseCitation(uriEncodedJson: string) {
  const parsed = JSON.parse(decodeURIComponent(uriEncodedJson));
  const { data, problems } = DataCitation(parsed);
  if (problems) {
    log.error(`Unexpected citation data`, parsed, problems);
    throw new Error(`Unexpected citation data: ` + problems.summary);
  }
  return data;
}
function parseAnnotation(uriEncodedJson: string) {
  const parsed = JSON.parse(decodeURIComponent(uriEncodedJson));
  const { data, problems } = DataAnnotation(parsed);
  if (problems) {
    log.error(`Unexpected annotation data`, parsed, problems);
    throw new Error(`Unexpected annotation data: ` + problems.summary);
  }
  return data;
}

function uniq<T>(arr: T[]) {
  return [...new Set(arr)];
}
