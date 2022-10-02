import assertNever from "assert-never";
import { encodeURI } from "js-base64";
import { uniqBy } from "lodash-es";

import { debug } from "./debug";
import PatchReaderInstance from "./patch-annot";

class ObsidianNote {
  // tslint:disable-line:variable-name
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
      "zotero-obsidian-note-strings"
    );

    this._notifierID = Zotero.Notifier.registerObserver(
      this,
      ["item"],
      "obsidian"
    );

    this._unloadAnnotPatch = PatchReaderInstance(
      {
        label: this.getString("pdfReader.openInObsidian"),
        condition: (data, getAnnotations) => {
          if (data.ids.length !== 1) return false;
          return getAnnotations()[0].hasTag("OB_NOTE");
        },
        /**
         * open notes of annotation exported to obsidian before
         */
        action: (_data, getAnnotations) => {
          this.sendToObsidian("annotation", "open", getAnnotations());
        },
      },
      {
        // only work if there is more than one annotation selected
        // not implemented yet
        label: this.getString("pdfReader.exportToObsidian"),
        condition: (_data, getAnnotations) =>
          getAnnotations().some((annot) => !annot.hasTag("OB_NOTE")),
        /**
         * export annotation to obsidian
         */
        action: (_data, getAnnotations) => {
          const items = getAnnotations().filter(
            (annot) => !annot.hasTag("OB_NOTE")
          );
          if (this.sendToObsidian("annotation", "export", items))
            setObNoteFlag(items);
        },
      }
    );
  }
  unload() {
    Zotero.Notifier.unregisterObserver(this._notifierID);
    this._unloadAnnotPatch();
  }

  /** Event handler for Zotero.Notifier */
  notify(action: any, type: any, ids: any, extraData: any) {
    // if (action === "add" && type === "item") {
    //   for (const annotation of ids
    //     .map((_id) => Zotero.Items.get(_id))
    //     .filter((item) => item.itemType === "annotation")) {
    //     annotation.annotationComment = "Done";
    //     annotation.saveTx();
    //   }
    // }
  }

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
    this.sendToObsidian("info", "export", items);
  }

  /**
   * @param items should all be Regular Items / Annotation Items
   * @returns if url is sent to obsidian successfully
   */
  sendToObsidian(
    type: "info" | "annotation",
    action: "open" | "export",
    items: any[]
  ): boolean {
    if (items.length === 0) return false;
    if (action === "open" && items.length > 1) {
      Zotero.logError("passed multiple items with action `open`");
      return false;
    }

    // URL in zotero don't parse other protocols properly
    let url = new URL(`http://zotero`);
    url.pathname = action;
    url.searchParams.append("type", type);

    const infoItem =
      type === "annotation" ? items[0].parentItem?.parentItem : items[0];
    if (type === "info") {
      if (items.length === 1) makeOpenURL(url, infoItem);
      const data = { info: items.map(injectFields) };
      url.searchParams.append("data", encodeURI(JSON.stringify(data)));
    } else {
      if (action === "open") {
        if (!infoItem?.isRegularItem()) {
          Zotero.logError(
            "No item for article info found for annotation: " +
              JSON.stringify(infoItem, null, 2)
          );
          return false;
        }
        makeOpenURL(
          url,
          infoItem,
          type === "annotation" ? items[0].key : undefined
        );
      } else if (action === "export") {
        let data: SendData_AnnotExport | SendData_InfoExport;
        if (type === "annotation") {
          data = {
            info: injectFields(infoItem),
            annotations: items.map((og) => {
              let copy = injectFields(og);
              if (["image", "ink"].includes(og.annotationType))
                copy.imageUrl = Zotero.Annotations.getCacheImagePath(og);
              return copy;
            }),
          };
        } else {
          assertNever(type);
        }
        url.searchParams.append("data", encodeURI(JSON.stringify(data)));
      } else {
        assertNever(action);
      }
    }

    // use this as a patch to fix the url
    url.protocol = "obsidian";
    Zotero.launchURL(url.toString());
    return true;
  }
}

const makeOpenURL = (url: URL, infoItem: any, annotKey?: string) => {
  const doi = infoItem.getField("DOI");
  if (doi) {
    url.searchParams.append("doi", doi);
  }
  url.searchParams.append("info-key", infoItem.key);
  url.searchParams.append("library-id", infoItem.libraryID);
  if (typeof infoItem.library.groupID === "number")
    url.searchParams.append("group-id", infoItem.library.groupID);
  if (annotKey) url.searchParams.append("annot-key", annotKey);
};

type SendData_AnnotExport = {
  info: any;
  annotations: {
    [key: string]: any;
    /** check if file exists in obsidian */
    imageUrl?: string;
  };
};

type SendData_InfoExport = {
  info: any[];
};

if (Zotero.ObsidianNote) Zotero.ObsidianNote.unload();
Zotero.ObsidianNote = new ObsidianNote();

// if (!Zotero.ObsidianNote) Zotero.ObsidianNote = new ObsidianNote();

const setObNoteFlag = (items: any[]) =>
  items.forEach((item) => item.addTag("OB_NOTE"));

const injectFields = (og: any) => {
  let copy = JSON.parse(JSON.stringify(og));
  copy.libraryID = og.libraryID;
  copy.groupID = og.library.groupID;
  copy.itemID = og.itemID;
  if (Zotero.BetterBibTeX) {
    const keyInfo = Zotero.BetterBibTeX.KeyManager.get(og.id);
    if (keyInfo) {
      copy.citekey = keyInfo.citekey;
    }
  }
  return copy;
};
