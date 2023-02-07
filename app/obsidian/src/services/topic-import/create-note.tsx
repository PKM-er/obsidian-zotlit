import { Notice } from "obsidian";
import log from "@/log";
import type ZoteroPlugin from "@/zt-main";

export async function createNote(
  ids: [id: number, lib: number][],
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
    await plugin.noteFeatures.createNoteForDocItem(item, (template, ctx) =>
      template.renderNote(
        {
          docItem: item,
          tags,
          attachment: null,
          allAttachments: attachments,
          annotations: [],
        },
        ctx,
        { tags: [currTopic] },
      ),
    );
    new Notice(`Created note for ${item.title}`, 1e3);
  }
}
