import { MarkdownView, Notice, TFile } from "obsidian";
import type { TemplatePreviewStateData } from "./base";
import { itemDetailsViewType } from "./details";
import { templatePreviewViewType } from "./preview";
import type { EjectableTemplate } from "@/services/template/settings";
import type ZoteroPlugin from "@/zt-main";

declare module "obsidian" {
  interface WorkspaceItem {
    type: string;
  }
}

export async function openTemplatePreview(
  type: EjectableTemplate,
  data: TemplatePreviewStateData | null,
  plugin: ZoteroPlugin,
) {
  const { workspace } = plugin.app;
  const file = getTemplateFile(type, plugin);
  if (!file || !(file instanceof TFile)) {
    new Notice("Template file not found: " + type);
    return;
  }
  const { templateLoader } = plugin;
  const existing = workspace
    .getLeavesOfType("markdown")
    .filter(
      (l) =>
        templateLoader.getTemplateTypeOf((l.view as MarkdownView)?.file) &&
        l.getRoot().type === "floating",
    );

  if (existing.length > 0) {
    await existing[0].openFile(file);
    return;
  }
  const left = workspace.openPopoutLeaf(),
    center = workspace.createLeafBySplit(left, "vertical"),
    right = workspace.createLeafBySplit(center, "vertical");
  await Promise.all([
    left.openFile(file, { active: true }),
    center.setViewState({
      type: templatePreviewViewType,
      state: {
        file: file.path,
        preview: data,
      },
      group: left,
    }),
    right.setViewState({
      type: itemDetailsViewType,
      state: {
        file: file.path,
        preview: data,
      },
      group: left,
    }),
  ]);
}

export function getTemplateFile(type: EjectableTemplate, plugin: ZoteroPlugin) {
  const filePath = plugin.templateLoader.getTemplateFile(type),
    file = plugin.app.vault.getAbstractFileByPath(filePath);
  if (!file || !(file instanceof TFile)) {
    return null;
  }
  return file;
}

export function getTemplateEditorInGroup(group: string, plugin: ZoteroPlugin) {
  const templateEditorLeaf = plugin.app.workspace
    .getGroupLeaves(group)
    .find(
      (l) =>
        l.view instanceof MarkdownView &&
        plugin.templateLoader.getTemplateTypeOf(l.view.file),
    );
  return templateEditorLeaf;
}
