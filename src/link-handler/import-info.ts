import { Notice, TFile } from "obsidian";

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
    console.log("imported zotero item: ", createdNotes);
  }
  if (existingNotes.length > 0 || failedToCreate.length > 0) {
    new Notice(
      `Failed to import ${
        existingNotes.length + failedToCreate.length
      } items, check log for details`,
    );
    if (existingNotes.length > 0)
      console.error("note already exists: ", existingNotes);
    if (failedToCreate.length > 0) {
      console.group();
      console.error("Error while creating note: ");
      failedToCreate.forEach((err) => console.error(err));
      console.groupEnd();
    }
  }
  if (createdNotes.length === 1)
    workspace.openLinkText(createdNotes[0].path, "", true);
};
