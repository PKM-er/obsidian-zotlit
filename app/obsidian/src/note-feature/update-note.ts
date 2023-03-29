import { EditorState } from "@codemirror/state";
import { groupBy } from "@mobily/ts-belt/Array";
import { mapWithKey } from "@mobily/ts-belt/Dict";
import { pipe } from "@mobily/ts-belt/pipe";
import type {
  AnnotationInfo,
  AttachmentInfo,
  ItemIDLibID,
  RegularItemInfoBase,
} from "@obzt/database";
import type { CachedMetadata, TFile } from "obsidian";
import {
  choosePDFAtch,
  cacheAttachmentSelect,
} from "@/components/atch-suggest";
import { getItemKeyGroupID } from "@/services/note-index";
import {
  isAnnotBlock,
  splitMultipleAnnotKey,
} from "@/services/note-index/utils";
import { ZOTERO_ATCHS_FIELDNAME } from "@/services/template/frontmatter";
import type { HelperExtra } from "@/services/template/helper";
import { toHelper } from "@/services/template/helper";
import type ZoteroPlugin from "@/zt-main";

function getAttachmentIDs(meta: CachedMetadata) {
  const attachmentIDs = meta?.frontmatter?.[ZOTERO_ATCHS_FIELDNAME];
  if (
    attachmentIDs &&
    Array.isArray(attachmentIDs) &&
    attachmentIDs.every(
      (v): v is number => typeof v === "number" && Number.isInteger(v) && v > 0,
    )
  ) {
    return attachmentIDs;
  }
  return [];
}

interface UpdateSummary {
  notes: number;
  addedAnnots: number;
  updatedAnnots: number;
}

export async function updateNote(
  item: RegularItemInfoBase,
  plugin: ZoteroPlugin,
): Promise<UpdateSummary | null> {
  const { app, noteIndex, templateRenderer } = plugin;

  const notePaths = noteIndex.getNotesFor(item);
  if (notePaths.length === 0) return null;

  const libId = plugin.database.settings.citationLibrary;
  const allAttachments = await plugin.databaseAPI.getAttachments(
    item.itemID,
    libId,
  );

  const allSelectedAtchIDs = new Set(
    notePaths.flatMap((path) => {
      const meta = app.metadataCache.getCache(path);
      if (!meta) return [];
      return getAttachmentIDs(meta);
    }),
  );
  const allSelectedAtchs = allAttachments.filter((a) =>
    allSelectedAtchIDs.has(a.itemID),
  );
  // if there is no selected attachment in the note, prompt the user to choose one
  let fallbackAtch: AttachmentInfo | undefined | null;
  if (allSelectedAtchs.length === 0) {
    fallbackAtch = await choosePDFAtch(allAttachments);
    if (fallbackAtch) {
      cacheAttachmentSelect(fallbackAtch, item);
      allSelectedAtchs.push(fallbackAtch);
    }
  }

  const extraByAtch = await getHelperExtraByAtch(
    item,
    { all: allAttachments, selected: allSelectedAtchs },
    plugin,
  );
  const mainExtra = Object.values(extraByAtch)[0];

  const summary: UpdateSummary = {
    notes: notePaths.length,
    addedAnnots: 0,
    updatedAnnots: 0,
  };

  for (const notePath of notePaths) {
    const meta = app.metadataCache.getCache(notePath);
    if (!meta) continue;
    let attachmentIDs = getAttachmentIDs(meta);
    if (attachmentIDs.length === 0) {
      if (fallbackAtch === undefined) {
        fallbackAtch = await choosePDFAtch(allSelectedAtchs);
      }
      if (fallbackAtch) {
        attachmentIDs = [fallbackAtch.itemID];
      } else {
        // if the user cancels the prompt (fallbackAtch===null), skip the annotations update
        attachmentIDs = [];
      }
    }
    const file = app.vault.getAbstractFileByPath(notePath) as TFile;
    const ctx = { plugin, sourcePath: notePath };

    if (plugin.settings.template.updateOverwrite) {
      // TODO: support import from multiple attachments
      const content = templateRenderer.renderNote(
        extraByAtch[attachmentIDs[0]],
        ctx,
      );
      await app.vault.modify(file, content);
      continue;
    }

    const annotSections = pipe(
      (meta.sections?.filter(isAnnotBlock) ?? []).flatMap((s) =>
        splitMultipleAnnotKey(s.id!).map((key) => [key, s.position] as const),
      ),
      groupBy(([key]) => key),
      mapWithKey((key, pos) => ({
        key: key as string,
        blocks: pos.map(([_, pos]) => pos),
      })),
    );
    const annotBlocks = new Set(
      Object.values(meta.blocks ?? {})
        ?.filter(isAnnotBlock)
        .flatMap((s) => splitMultipleAnnotKey(s.id!).map((key) => key)),
    );
    const toAdd = new Map<HelperExtra, AnnotationInfo[]>(
        attachmentIDs.map((id) => [extraByAtch[id], []]),
      ),
      toUpdate: { from: number; to: number; insert: string }[] = [];
    attachmentIDs.forEach((atchID) => {
      const extra = extraByAtch[atchID];
      extra.annotations.forEach((annot) => {
        const blockID = getItemKeyGroupID(annot, true);
        const ranges = annotSections[blockID];
        if (ranges) {
          // only update existing content if explicitly enabled
          if (!plugin.settings.template.updateAnnotBlock) return;
          const insert = templateRenderer.renderAnnot(annot, extra, ctx);
          toUpdate.push(
            ...ranges.blocks.map((r) => ({
              from: r.start.offset,
              to: r.end.offset,
              insert,
            })),
          );
        } else if (!annotBlocks.has(blockID)) {
          toAdd.get(extra)!.push(annot);
        }
        // blocks that are not section do not support in-place update
      });
    });
    if (toUpdate.length > 0) {
      const updatedContent = EditorState.create({
        doc: await app.vault.read(file),
      })
        .update({ changes: toUpdate })
        .state.doc.toString();
      await app.vault.modify(file, updatedContent);
    }
    await templateRenderer.setFrontmatterTo(
      file,
      toHelper(mainExtra, ctx).docItem,
    );
    const toAppend = [...toAdd].reduce((acc, [extra, annotsToAdd]) => {
      if (annotsToAdd.length === 0) return acc;
      const toAppend = templateRenderer.renderAnnots(
        { ...extra, annotations: annotsToAdd },
        ctx,
      );
      return (acc ? acc + "\n" : acc) + toAppend;
    }, "");
    if (toAppend) {
      await app.vault.append(file, toAppend);
    }
    const updated = toUpdate.length,
      added = [...toAdd.values()].reduce((acc, v) => acc + v.length, 0);
    summary.updatedAnnots += updated;
    summary.addedAnnots += added;
  }
  return summary;
}

export async function getHelperExtraByAtch(
  item: RegularItemInfoBase,
  {
    all: allAttachments,
    selected: attachments,
  }: {
    all: AttachmentInfo[];
    selected: AttachmentInfo[];
  },
  plugin: ZoteroPlugin,
): Promise<Record<number, HelperExtra>> {
  const libId = plugin.database.settings.citationLibrary;
  const tagsRecord = await plugin.databaseAPI.getTags([[item.itemID, libId]]);
  if (attachments.length === 0) {
    return {
      [-1]: {
        docItem: item,
        attachment: null,
        tags: tagsRecord,
        allAttachments,
        annotations: [],
      },
    };
  }
  const extras: Record<number, HelperExtra> = {};
  for (const attachment of attachments) {
    const annotations: AnnotationInfo[] = attachment
      ? await plugin.databaseAPI.getAnnotations(attachment.itemID, libId)
      : [];
    extras[attachment.itemID] = {
      docItem: item,
      attachment,
      tags: {
        ...tagsRecord,
        ...(await plugin.databaseAPI.getTags(
          annotations.map((i): ItemIDLibID => [i.itemID, libId]),
        )),
      },
      allAttachments,
      annotations,
    };
  }
  return extras;
}
