import type { TFile } from "obsidian";
import { Notice } from "obsidian";
import log from "@log";

import { promptOpenLog } from "../utils/index.js";
import type ZoteroPlugin from "../zt-main.js";
import createNote, { NoteExistsError } from "./create-note.js";
import type { SendDataInfoExport } from "./index.js";

export const importInfoItems = async (
  plugin: ZoteroPlugin,
  data: SendDataInfoExport,
) => {
  const { workspace } = plugin.app;

  const createdNotes: TFile[] = [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    failedToCreate: any[] = [],
    existingNotes: string[] = [];

  for (const result of await Promise.allSettled(
    data.info.map((item) => createNote(plugin, item)),
  )) {
    if (result.status === "fulfilled") {
      createdNotes.push(result.value);
    } else if (result.reason instanceof NoteExistsError) {
      existingNotes.push(result.reason.target);
    } else {
      failedToCreate.push(result.reason);
    }
  }

  if (createdNotes.length > 0) {
    new Notice(`Successful imported ${createdNotes.length} items.`);
    log.info("imported zotero item: ", createdNotes);
  }
  if (existingNotes.length > 0 || failedToCreate.length > 0) {
    new Notice(
      `Failed to import ${
        existingNotes.length + failedToCreate.length
      } items, for details, ${promptOpenLog()}`,
    );
    if (existingNotes.length > 0)
      log.warn("note already exists: ", existingNotes);
    if (failedToCreate.length > 0) {
      log.error("Error while creating note: ");
      failedToCreate.forEach((err) => log.warn(err));
    }
  }
  if (createdNotes.length === 1)
    workspace.openLinkText(createdNotes[0].path, "", false);
};
