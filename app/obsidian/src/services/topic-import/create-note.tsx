import type { INotifyRegularItem } from "@obzt/protocol";
import { Notice } from "obsidian";
import log from "@/log";
import type ZoteroPlugin from "@/zt-main";

export async function createNote(
  data: INotifyRegularItem,
  { currTopic, plugin }: { currTopic: string; plugin: ZoteroPlugin },
) {
  const items = (await plugin.databaseAPI.getItems(data.ids, true)).flatMap(
    (item, index) => {
      if (item === null) {
        log.warn("item not found", data.ids[index]);
        return [];
      }
      return [[item, index] as const];
    },
  );
  const tags = await plugin.databaseAPI.getTags(data.ids);

  for (const [item, index] of items) {
    const attachments = await plugin.databaseAPI.getAttachments(
      ...data.ids[index],
    );
    await plugin.createNoteForDocItem(item, (template, ctx) =>
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
