import type { App } from "obsidian";
import { MarkdownView, Notice, TFile } from "obsidian";
import { fromPath, toPath, type TplType } from "@/services/template/eta/preset";
import type { SettingsService } from "@/settings/base";
import type ZoteroPlugin from "@/zt-main";
import type { TemplatePreviewStateData } from "./base";
import { itemDetailsViewType } from "./details";
import { templatePreviewViewType } from "./preview";

export async function openTemplatePreview(
  type: TplType.Ejectable,
  data: TemplatePreviewStateData | null,
  { app, settings }: { app: App; settings: SettingsService },
) {
  const { workspace } = app;
  const file = getTemplateFile(type, settings.templateDir, app);
  if (!file || !(file instanceof TFile)) {
    new Notice("Template file not found: " + type);
    return;
  }
  const existing = workspace.getLeavesOfType("markdown").filter((l) => {
    const view = l.view as MarkdownView;
    if (!view.file) return false;
    return (
      fromPath(view.file.path, settings.templateDir)?.type === "ejectable" &&
      l.getRoot().type === "floating"
    );
  });

  if (existing.length > 0) {
    const markdown = existing[0];
    await markdown.openFile(file);
    if (!markdown.group) return;
    const inGroup = workspace.getGroupLeaves(markdown.group);
    for (const leaf of inGroup) {
      const viewType = leaf.view.getViewType();
      if (
        viewType === templatePreviewViewType ||
        viewType === itemDetailsViewType
      ) {
        const prev = leaf.view.getState();
        await leaf.view.setState({ ...prev, preview: data }, {});
      }
    }
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

export function getTemplateFile(
  type: TplType.Ejectable,
  templateDir: string,
  app: App,
) {
  const filepath = toPath(type, templateDir),
    file = app.vault.getAbstractFileByPath(filepath);
  if (file instanceof TFile) return file;
  return null;
}

export function getTemplateEditorInGroup(group: string, plugin: ZoteroPlugin) {
  const templateEditorLeaf = plugin.app.workspace
    .getGroupLeaves(group)
    .find(
      (l) =>
        l.view instanceof MarkdownView &&
        l.view.file &&
        fromPath(l.view.file.path, plugin.settings.templateDir)?.type ===
          "ejectable",
    );
  return templateEditorLeaf;
}
