import "./style.less";

import type { NoteFieldsData } from "@obzt/components";
import { ObsidianContext, PrepareNote } from "@obzt/components";
import type { WorkspaceLeaf } from "obsidian";
import { Notice } from "obsidian";
import ReactDOM from "react-dom";
import type { FallbackProps } from "react-error-boundary";
import { ErrorBoundary } from "react-error-boundary";
import { context } from "@/components/basic/context";
import { DerivedFileView } from "@/components/derived-file-view";
import { untilMetaReady } from "@/utils/once";
import type ZoteroPlugin from "@/zt-main";
import { NoteFieldsMain } from "./component";

export const noteFieldsViewType = "zotero-note-fields";

export class NoteFieldsView extends DerivedFileView {
  constructor(leaf: WorkspaceLeaf, public plugin: ZoteroPlugin) {
    super(leaf);
    this.contentEl.addClass("obzt");
  }

  public getViewType(): string {
    return noteFieldsViewType;
  }

  onload(): void {
    super.onload();
  }

  public getDisplayText(): string {
    const activeDoc = this.plugin.app.workspace.getActiveFile();
    let suffix = "";
    if (activeDoc?.extension === "md") suffix = ` for ${activeDoc.basename}`;
    return "Fields of Literature note" + suffix;
  }

  public getIcon(): string {
    return "layout-list";
  }

  update() {
    for (const callback of this.#updateHanlders) {
      callback();
    }
    // const file = this.getFile();
    // this.untilZoteroReady().then(this.loadDocItem);
  }

  registerUpdateHanlder(cb: () => any) {
    this.#updateHanlders.push(cb);
    const unregister = () => {
      this.#updateHanlders = this.#updateHanlders.filter((h) => h !== cb);
    };
    this.register(unregister);
    return unregister;
  }

  #updateHanlders: (() => any)[] = [];

  canAcceptExtension(_extension: string): boolean {
    // accept all extensions
    // otherwise the leaf will be re-opened with linked file
    // whenever the linked file changes
    // (default syncstate behavior for grouped leaves)
    return true;
  }

  ErrorFallback = ErrorFallback.bind(this);

  protected async onOpen() {
    await super.onOpen();
    const [task, cancel] = untilMetaReady(this.app, {});
    cancel && this.register(cancel);
    await task;
    const ErrorFallback = this.ErrorFallback;
    ReactDOM.render(
      <ObsidianContext.Provider value={context}>
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <NoteFieldsMain view={this} />
        </ErrorBoundary>
      </ObsidianContext.Provider>,
      this.contentEl,
    );
  }
  protected async onClose() {
    ReactDOM.unmountComponentAtNode(this.contentEl);
    await super.onClose();
  }

  getFields() {
    try {
      if (!this.file) return null;
      const meta = this.app.metadataCache.getFileCache(this.file);

      if (!meta) return null;

      const fm = meta.frontmatter as unknown;

      if (fm === null || fm === undefined) {
        // create empty fields
        return this.fieldsToExtract.reduce((acc, fieldName) => {
          acc[fieldName] = [];
          return acc;
        }, {} as NoteFieldsData);
      }

      if (!isRecord(fm)) {
        throw new InvaildFieldError(
          `Frontmatter is not an record: ${fm}`,
          "_",
          fm,
        );
      }

      const fields = this.fieldsToExtract.reduce((acc, fieldName) => {
        if (!(fieldName in fm)) {
          acc[fieldName] = [];
          return acc;
        }
        const values = fm[fieldName];
        if (typeof values === "string" || typeof values === "number") {
          throw new UnpreparedFieldError(`Field ${fieldName}`, fieldName, fm);
        }

        if (!isStringArray(values)) {
          throw new InvaildFieldError(
            `Field ${fieldName} is not a string array`,
            fieldName,
            fm,
          );
        }
        acc[fieldName] = values.map((content) => {
          if (!content)
            throw new UnpreparedFieldError(`Field ${fieldName}`, fieldName, fm);
          return content;
        });
        return acc;
      }, {} as NoteFieldsData);
      return fields;
    } catch (error) {
      if (error instanceof InvaildFieldError) {
        new Notice(error.message);
      } else if (error instanceof UnpreparedFieldError) {
        throw error;
      } else {
        new Notice(
          `Failed to load note fields from file ${this.file.path}, check console for details`,
        );
      }
      console.error(error, this.file);
      return null;
    }
  }

  /**
   * @param content null to delete the field
   */
  async setField(content: string | null, field: string, index: number) {
    try {
      await this.app.fileManager.processFrontMatter(
        this.file,
        (fm: Record<string, unknown>) => {
          // make sure the empty string is converted to null
          if (content !== null) {
            content = content.trim();
            if (!content) content = null;
          }
          const values = fm[field] as unknown;
          if (values === undefined || values === null) {
            if (!content) return;
            fm[field] = [content];
            return;
          }

          if (typeof values === "string") {
            if (content !== null) {
              fm[field] = [values, content];
            } else {
              fm[field] = [values];
            }
            return;
          }
          if (typeof values === "number" && content) {
            fm[field] = [String(values), content];
            return;
          }

          if (!isStringArray(values)) {
            throw new FieldWriteError(
              `Cannot write to field ${field} due to existing values: ${values}`,
              field,
              values,
            );
          }

          const updateAt = (index: number, data: string | null) => {
              if (data) {
                (fm[field] as string[])[index] = data;
              } else {
                (fm[field] as string[]).splice(index, 1);
                if ((fm[field] as string[]).length === 0) delete fm[field];
              }
            },
            insert = (data: string) => (fm[field] as string[]).push(data);

          const data = content;
          // if the index is valid, update the value directly
          if (values[index]) {
            updateAt(index, data);
            return;
          }
          if (!data) return;
          // if the id is not found, insert the value at the end
          insert(data);
        },
      );
    } catch (error) {
      if (error instanceof FieldWriteError) {
        new Notice(error.message);
      } else {
        new Notice(
          `Failed to write note fields to file ${this.file}: ${
            error instanceof Error ? error.message : "Check console for details"
          }`,
        );
      }
      console.error(error, this.file);
    }
  }

  get fieldsToExtract() {
    return this.plugin.settings.noteFields.fieldNames;
  }

  async prepareFields() {
    try {
      await this.app.fileManager.processFrontMatter(
        this.file,
        (fm: Record<string, unknown>) => {
          for (const fieldName of this.fieldsToExtract) {
            const values = fm[fieldName];
            if (values === undefined || values === null) {
              continue;
            }
            if (typeof values === "string") {
              fm[fieldName] = [values];
              continue;
            }
            if (typeof values === "number") {
              fm[fieldName] = [String(values)];
              continue;
            }
            if (!isStringArray(values)) {
              throw new FieldWriteError(
                `Cannot write to field ${fieldName} due to existing values: ${values}`,
                fieldName,
                values,
              );
            }
            fm[fieldName] = values;
          }
        },
      );
    } catch (error) {
      if (error instanceof FieldWriteError) {
        new Notice(error.message);
      } else {
        new Notice(
          `Failed to convert existing fields in file ${this.file}: ${
            error instanceof Error ? error.message : "Check console for details"
          }`,
        );
      }
      console.error(error, this.file);
    }
  }
}

export class InvaildFieldError extends Error {
  constructor(
    message: string,
    public fieldName: string,
    public frontmatter: any,
  ) {
    super(message);
  }
}

export class UnpreparedFieldError extends Error {
  constructor(
    message: string,
    public fieldName: string,
    public frontmatter: any,
  ) {
    super(message);
  }
}

export class FieldWriteError extends Error {
  constructor(
    message: string,
    public fieldName: string,
    public frontmatter: any,
  ) {
    super(message);
  }
}

const isStringArray = (x: unknown): x is string[] =>
  Array.isArray(x) && x.every((x) => typeof x === "string");

const isRecord = (x: unknown): x is Record<string, unknown> =>
  typeof x === "object" && x !== null;

function ErrorFallback(
  this: NoteFieldsView,
  { error, resetErrorBoundary }: FallbackProps,
) {
  if (error instanceof UnpreparedFieldError) {
    return (
      <PrepareNote
        onClick={async () => {
          await this.prepareFields();
          const ref = this.app.metadataCache.on("changed", () => {
            this.app.metadataCache.offref(ref);
            resetErrorBoundary();
          });
          this.registerEvent(ref);
        }}
      />
    );
  }
  return (
    <div role="alert">
      <p>Something went wrong:</p>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}
