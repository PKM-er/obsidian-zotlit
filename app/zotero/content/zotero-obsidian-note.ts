import type { AnnotationsQuery, ItemQuery, ItemsQuery } from "@obzt/common";
import { stringifyQuery } from "@obzt/common";
import assertNever from "assert-never";
import { uniqBy } from "lodash-es";
import version from "../gen/version.js";

// import { debug } from "./debug";
import patchReaderInstance from "./patch-annot";

class ObsidianNote {
  private initialized = false;
  private globals: Record<string, any>;
  private strings: { getString: (key: string) => string };
  private _notifierID: any;
  private _unloadAnnotPatch: () => void;

  public getString(key: string) {
    try {
      return this.strings.getString(key);
    } catch (error) {
      return null;
    }
  }

  public async load(globals: Record<string, any>) {
    Zotero.log("Loading ObsidianNote");

    this.globals = globals;

    if (this.initialized) return;
    this.initialized = true;

    this.strings = globals.document.getElementById(
      "zotero-obsidian-note-strings",
    );

    // this._notifierID = Zotero.Notifier.registerObserver(
    //   this,
    //   ["item"],
    //   "obsidian",
    // );

    this._unloadAnnotPatch = patchReaderInstance(
      {
        label: this.getString("pdfReader.toObsidian"),
        condition: (_data, _getAnnotations) => {
          return true;
        },
        /**
         * open notes of annotation exported to obsidian before
         */
        action: (_data, getAnnotations) => {
          this.sendToObsidian("annotation", getAnnotations());
        },
      },
      // {
      //   // only work if there is more than one annotation selected
      //   // not implemented yet
      //   label: this.getString("pdfReader.exportToObsidian"),
      //   condition: (_data, getAnnotations) =>
      //     getAnnotations().some((annot) => !annot.hasTag("OB_NOTE")),
      //   /**
      //    * export annotation to obsidian
      //    */
      //   action: (_data, getAnnotations) => {
      //     const items = getAnnotations().filter(
      //       (annot) => !annot.hasTag("OB_NOTE"),
      //     );
      //     this.sendToObsidian("annotation", "export", items);
      //   },
      // },
    );
  }
  unload() {
    // Zotero.Notifier.unregisterObserver(this._notifierID);
    this._unloadAnnotPatch();
  }

  /** Event handler for Zotero.Notifier */
  // notify(action: any, type: any, ids: any, extraData: any) {
  //   if (action === "add" && type === "item") {
  //     for (const annotation of ids
  //       .map((_id) => Zotero.Items.get(_id))
  //       .filter((item) => item.itemType === "annotation")) {
  //       annotation.annotationComment = "Done";
  //       annotation.saveTx();
  //     }
  //   }
  // }

  handleSelectedItems() {
    const isVaild = (item): boolean =>
      item.isRegularItem() || // !note && !annotation && !attachment
      (item.isAttachment() && !!item?.parentItem?.isRegularItem());
    const getInfoItem = (item) =>
      item.isAttachment() ? item.parentItem : item;

    let items = ZoteroPane.getSelectedItems() as any[];
    if (items.length === 0) return;
    items = items.filter(isVaild).map(getInfoItem);
    if (items.length === 0) return;
    items = uniqBy(items, "id");
    this.sendToObsidian("item", items);
  }

  /**
   * @param items should all be Regular Items / Annotation Items
   * @returns if url is sent to obsidian successfully
   */
  sendToObsidian(type: "item" | "annotation", items: any[]): boolean {
    if (items.length === 0) return false;

    let query: AnnotationsQuery | ItemsQuery;
    const infoItem =
      type === "annotation" ? items[0].parentItem?.parentItem : items[0];
    if (type === "item") {
      query = {
        version,
        type,
        items: items.map(buildItemRecord),
      };
    } else if (type === "annotation") {
      query = {
        version,
        type,
        annots: items.map(buildItemRecord),
        parent: buildItemRecord(infoItem),
      };
    } else {
      assertNever(type);
    }

    // use this as a patch to fix the url
    const url = stringifyQuery(`obsidian://zotero/selected`, query);
    Zotero.launchURL(url.toString());
    return true;
  }
}

const buildItemRecord = (item: any): ItemQuery => {
  const obj: ItemQuery = {
    key: item.key,
    id: item.id,
    libraryID: item.libraryID,
  };
  if (typeof item.library.groupID === "number")
    obj.groupID = item.library.groupID;
  return obj;
};

if (Zotero.ObsidianNote) Zotero.ObsidianNote.unload();
Zotero.ObsidianNote = new ObsidianNote();

// if (!Zotero.ObsidianNote) Zotero.ObsidianNote = new ObsidianNote();
