import type { ItemIDLibID } from "@obzt/database";
import { Notice } from "obsidian";
import log from "@/log";
import type ZoteroPlugin from "@/zt-main";

export async function createNote(
  ids: ItemIDLibID[],
  { currTopic, plugin }: { currTopic: string; plugin: ZoteroPlugin },
) {
  const items = (await plugin.databaseAPI.getItems(ids, true)).flatMap(
    (item, index) => {
      if (item === null) {
        log.warn("item not found", ids[index]);
        return [];
      }
      return [[item, index] as const];
    },
  );
  const tags = await plugin.databaseAPI.getTags(ids);

  for (const [item, index] of items) {
    const attachments = await plugin.databaseAPI.getAttachments(...ids[index]);
    const extra = {
      docItem: item,
      tags,
      attachment: null,
      allAttachments: attachments,
      annotations: [],
    };
    await plugin.noteFeatures.createNoteForDocItem(item, {
      note: (template, ctx) =>
        template.renderNote(extra, ctx, { tags: [currTopic] }),
      filename: (template, ctx) => template.renderFilename(extra, ctx),
    });
    new Notice(`Created note for ${item.title}`, 1e3);
  }
}
