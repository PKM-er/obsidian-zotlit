import type ZoteroPlugin from "../../zt-main";
import { bracketExtension } from "./bracket";
import { EtaSuggest } from "./suggester";

const registerEtaEditorHelper = (plugin: ZoteroPlugin) => {
  // cause issue with canvas, disable for now
  // setBracketExtension(plugin, plugin.settings.autoPairEta);
  // plugin.registerEditorExtension(plugin.editorExtensions);
  plugin.registerEditorSuggest(new EtaSuggest(plugin.app));
};

export const setBracketExtension = (plugin: ZoteroPlugin, enable: boolean) => {
  plugin.editorExtensions.length = 0;
  if (enable) plugin.editorExtensions.push(bracketExtension);
};

export default registerEtaEditorHelper;
