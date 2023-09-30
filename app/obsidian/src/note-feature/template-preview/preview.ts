import { assertNever } from "assert-never";
import { loadPrism, Component, TFile, Notice } from "obsidian";
import type { TplType } from "@/services/template/eta/preset";
import { TemplatePreviewBase, asyncDebounce, toCtx } from "./base";
import { getTemplateEditorInGroup, getTemplateFile } from "./open";

export const templatePreviewViewType = "zotero-template-preview";

export class TemplatePreview extends TemplatePreviewBase {
  getViewType(): string {
    return templatePreviewViewType;
  }
  getDisplayText(): string {
    const type = this.store.getState().templateType;
    if (!type) {
      return "Zotero Template Preview";
    }
    return "Zotero Template Preview: " + type;
  }

  async switchToTemplate(type: TplType.Ejectable) {
    if (!this.leaf.group) return false;
    const templateEditorLeaf = getTemplateEditorInGroup(
      this.leaf.group,
      this.plugin,
    );
    if (!templateEditorLeaf) return false;
    const file = getTemplateFile(type, this.plugin);
    if (!file || !(file instanceof TFile)) {
      new Notice("Template file not found: " + type);
      return;
    }
    await templateEditorLeaf.openFile(file);
    return true;
  }
  onload(): void {
    const switchTemplateActions = {
      annots: this.addAction(
        "list-ordered",
        "Open Template for Annotations",
        async () =>
          (await this.switchToTemplate("annots")) ||
          new Notice("Cannot switch to template"),
      ),
      note: this.addAction(
        "file-input",
        "Open Note Template",
        async () =>
          (await this.switchToTemplate("note")) ||
          new Notice("Cannot switch to template"),
      ),
      annotation: this.addAction(
        "highlighter",
        "Open Template for Single Annotation",
        async () =>
          (await this.switchToTemplate("annotation")) ||
          new Notice("Cannot switch to template"),
      ),
      field: this.addAction(
        "info",
        "Open Template for Note Properties",
        async () =>
          (await this.switchToTemplate("field")) ||
          new Notice("Cannot switch to template"),
      ),
    };
    Object.values(switchTemplateActions).forEach((a) => a.hide());
    this.register(
      this.store.subscribe((curr, prev) => {
        if (curr.templateType === prev.templateType) return;
        for (const [type, action] of Object.entries(switchTemplateActions)) {
          action.toggle(type !== curr.templateType);
        }
      }),
    );
    this.registerEvent(
      this.app.vault.on("zotero:template-updated", (type) => {
        const currType = this.getTemplateType(this.file);
        if (currType && type === currType) {
          // trigger update on eject state change
          this.setTemplateType(currType);
          this.requestRender();
        }
      }),
    );
  }

  content: PreviewContent | null = null;
  async render() {
    const { preview, templateType } = this.store.getState();
    if (!templateType) {
      this.contentEl.empty();
      this.contentEl.setText("No template preview available");
      return;
    }
    if (!preview) {
      this.contentEl.empty();
      this.contentEl.setText("No preview data available");
      return;
    }
    let markdown = "";
    const ctx = toCtx(this.plugin);
    const renderer = this.plugin.templateRenderer;
    try {
      switch (templateType) {
        case "annotation": {
          const annot = preview.annot ?? preview.annotations[0];
          if (!annot) {
            this.contentEl.setText("No annotation data available");
            return;
          }
          markdown = renderer.renderAnnot(annot, preview, ctx);
          break;
        }
        case "annots":
          markdown = renderer.renderAnnots(preview, ctx);
          break;
        case "note":
          markdown = renderer.renderNote(preview, ctx);
          break;
        case "field":
          markdown = renderer.renderFrontmatter(preview, ctx);
          break;
        case "cite":
          markdown = renderer.renderCitations([preview], ctx);
          break;
        case "cite2":
          markdown = renderer.renderCitations([preview], ctx, true);
          break;
        case "colored":
          markdown = renderer.renderColored({
            content: "I'm Highlight",
            color: "#FF000080",
            colorName: "red",
            bgColor: "#FF000080",
            bgColorName: "red",
          });
          break;
        default:
          assertNever(templateType);
      }
      if (markdown === this.content?.markdown) return;
      this.content?.unload();
      this.contentEl.empty();
      const prism = await loadPrism();
      const html = prism.highlight(
        markdown,
        prism.languages.markdown,
        "markdown",
      );

      this.content = new PreviewContent(markdown);
      this.contentEl
        .createEl("pre")
        .createEl("code", { cls: "language-markdown" }).innerHTML = html;
      // await MarkdownRenderer.renderMarkdown(
      //   markdown,
      //   this.contentEl,
      //   ctx.sourcePath,
      //   this.content
      // );
    } catch (error) {
      this.content?.unload();
      this.contentEl.empty();
      const msg = error instanceof Error ? error.message : String(error);
      this.contentEl.createEl("h1", {
        text: `Error while rendering ${templateType}`,
        cls: ["mod-error", "message"],
      });
      this.contentEl.createEl("pre", {
        text: msg,
      });
    }
  }
  requestRender = asyncDebounce(() => this.render(), 200);

  protected async onOpen() {
    await super.onOpen();
    this.register(
      this.store.subscribe((curr, prev) => {
        if (curr.templateType !== prev.templateType) {
          this.requestRender();
        } else if (curr.preview !== prev.preview) {
          this.requestRender();
        }
      }),
    );
  }
}

class PreviewContent extends Component {
  constructor(public markdown: string) {
    super();
  }
}
