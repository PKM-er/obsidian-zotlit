import { Notice, ObsidianProtocolData } from "obsidian";

import ZoteroPlugin from "../zt-main";

const openItemNote = (
  plugin: ZoteroPlugin,
  params: ObsidianProtocolData,
  slience = false,
): boolean => {
  const { workspace } = plugin.app;
  const {
    // type,
    // doi,
    ["info-key"]: infoKey,
    // ["library-id"]: libraryId,
    ["annot-key"]: annotKey,
    ["group-id"]: groupId,
  } = params;

  const info = plugin.noteIndex.getNoteFromKey({
    itemType: annotKey ? "annotation" : undefined,
    groupID: groupId && Number.isInteger(+groupId) ? +groupId : undefined,
    key: annotKey ?? infoKey,
  });
  if (!info) {
    !slience &&
      new Notice(
        `No literature note found for zotero item with key ${infoKey}`,
      );
    return false;
  }

  let linktext = info.file;
  if (info.blockId) {
    linktext += "#^" + info.blockId;
  }

  workspace.openLinkText(linktext, "", false);
  return true;
};
export default openItemNote;
