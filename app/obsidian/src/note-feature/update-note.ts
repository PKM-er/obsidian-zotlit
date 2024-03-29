import { EditorState } from "@codemirror/state";
import { groupBy } from "@mobily/ts-belt/Array";
import { mapWithKey } from "@mobily/ts-belt/Dict";
import { pipe } from "@mobily/ts-belt/pipe";
import type {
  AnnotationInfo,
  AttachmentInfo,
  IDLibID,
  RegularItemInfoBase,
} from "@obzt/database";
import type { TFile } from "obsidian";
import {
  chooseAnnotAtch,
  cacheAttachmentSelect,
} from "@/components/atch-suggest";
import { getItemKeyGroupID } from "@/services/note-index";
import {
  getAtchIDsOf,
  isAnnotBlock,
  splitMultipleAnnotKey,
} from "@/services/note-index/utils";
import type { HelperExtra } from "@/services/template/helper";
import { toHelper } from "@/services/template/helper";
import type { NoteNormailzed } from "@/services/template/helper/item";
import type ZoteroPlugin from "@/zt-main";

interface UpdateSummary {
  notes: number;
  addedAnnots: number;
  updatedAnnots: number;
}

export async function updateNote(
  item: RegularItemInfoBase,
  plugin: ZoteroPlugin,
  overwrite = plugin.settings.current?.updateOverwrite,
): Promise<UpdateSummary | null> {
  const { app, noteIndex, templateRenderer } = plugin;

  const notePaths = noteIndex.getNotesFor(item);
  if (notePaths.length === 0) return null;

  const libId = plugin.settings.libId;
  const allAttachments = await plugin.databaseAPI.getAttachments(
    item.itemID,
    libId,
  );

  const allSelectedAtchIDs = new Set(
    notePaths.flatMap((p) => getAtchIDsOf(p, plugin.app.metadataCache)),
  );
  const allSelectedAtchs = allAttachments.filter((a) =>
    allSelectedAtchIDs.has(a.itemID),
  );
  // if there is no selected attachment in the note, prompt the user to choose one
  let fallbackAtch: AttachmentInfo | undefined | null;
  if (allSelectedAtchs.length === 0) {
    fallbackAtch = await chooseAnnotAtch(allAttachments, plugin.app);
    if (fallbackAtch) {
      cacheAttachmentSelect(fallbackAtch, item);
      allSelectedAtchs.push(fallbackAtch);
    }
  }

  const notes = await plugin.databaseAPI
    .getNotes(item.itemID, libId)
    .then((notes) => plugin.noteParser.normalizeNotes(notes));

  const extraByAtch = await getHelperExtraByAtch(
    item,
    { all: allAttachments, selected: allSelectedAtchs, notes },
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
    let attachmentIDs = getAtchIDsOf(notePath, plugin.app.metadataCache);
    if (!attachmentIDs) {
      if (fallbackAtch === undefined) {
        fallbackAtch = await chooseAnnotAtch(allSelectedAtchs, plugin.app);
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

    if (overwrite) {
      // TODO: support import from multiple attachments
      const content = await templateRenderer.renderNote(
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

    await Promise.all(
      attachmentIDs.map(async (atchID) => {
        const extra = extraByAtch[atchID];
        if (!extra.annotations || extra.annotations.length === 0) return;
        return await Promise.all(
          extra.annotations.map(async (annot) => {
            const blockID = getItemKeyGroupID(annot, true);
            const ranges = annotSections[blockID];
            if (ranges) {
              // only update existing content if explicitly enabled
              if (!plugin.settings.current?.updateAnnotBlock) return;
              const insert = await templateRenderer.renderAnnot(
                annot,
                extra,
                ctx,
              );
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
          }) ?? [],
        );
      }),
    );

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
    notes,
  }: {
    all: AttachmentInfo[];
    selected: AttachmentInfo[];
    notes: NoteNormailzed[];
  },
  plugin: ZoteroPlugin,
): Promise<Record<number, HelperExtra>> {
  const libId = plugin.settings.libId;
  const tagsRecord = await plugin.databaseAPI.getTags([[item.itemID, libId]]);

  if (attachments.length === 0) {
    return {
      [-1]: {
        docItem: item,
        attachment: null,
        tags: tagsRecord,
        allAttachments,
        annotations: [],
        notes,
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
          annotations.map((i): IDLibID => [i.itemID, libId]),
        )),
      },
      allAttachments,
      annotations,
      notes,
    };
  }
  return extras;
}
