import type ZoteroPlugin from "../../zt-main";
import { bracketExtension } from "./bracket";
import { EtaSuggest } from "./suggester";

const registerEtaEditorHelper = (plugin: ZoteroPlugin) => {
  if (plugin.settings.autoPairEta) {
    enableBracketExtension(plugin);
  }
  plugin.registerEditorExtension(plugin.editorExtensions);
  plugin.registerEditorSuggest(new EtaSuggest(plugin.app));
};

export const enableBracketExtension = (plugin: ZoteroPlugin) => {
  plugin.editorExtensions.push(bracketExtension);
};

export default registerEtaEditorHelper;
