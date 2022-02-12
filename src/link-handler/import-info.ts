import log from "loglevel";
import { Notice, TFile } from "obsidian";

import { promptOpenLog } from "../utils";
import ZoteroPlugin from "../zt-main";
import createNote, { NoteExistsError } from "./create-note";
import { SendData_InfoExport } from "./index";

export const importInfoItems = async (
  plugin: ZoteroPlugin,
  data: SendData_InfoExport,
) => {
  const { workspace } = plugin.app;

  let createdNotes: TFile[] = [],
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
