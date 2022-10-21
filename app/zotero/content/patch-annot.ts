import { around } from "monkey-around";

type ReaderData = {
  [key: string]: any;
  enableEditHighlightedText:
    | false
    | {
        [key: string]: any;
        comment: string;
        libraryID: number;
        /** itemKEY not itemID */
        id: string;
        tags: { name: string; [key: string]: any }[];
      };
  /** itemKEY not itemID */
  currentID: string;
  /** itemKEY of all selected items */
  ids: string[];
};

type MenuItemProps = {
  label: string;
  condition: (data: ReaderData, getAnnotations: () => any[]) => boolean;
  action: (data: ReaderData, getAnnotations: () => any[]) => any;
};

/**
 * @returns patch unloader function
 */
const patchReaderInstance = (...items: MenuItemProps[]) => {
  const addMenuItem = (
    reader: any,
    data: ReaderData,
    getAnnotations: () => any[],
  ) => {
    for (const props of items) {
      const { label, condition, action } = props;
      if (condition(data, getAnnotations)) {
        Zotero.debug("Try to add menu item for annotation popup: " + label);
        const poppers = reader._popupset.childNodes;
        const popup = poppers[poppers.length - 1];
        if (!popup) {
          Zotero.log(
            "No popup found while trying to add annotation popup:" + label,
          );
          return;
        }
        const menuitem = reader._window.document.createElement("menuitem");
        menuitem.setAttribute("label", label);
        menuitem.setAttribute("disabled", false);
        menuitem.addEventListener("command", () =>
          action(data, getAnnotations),
        );
        popup.prepend(menuitem);
      }
    }
  };

  let notifierID = null,
    revertPatch = null;
  const notifier = {
    // eslint-disable-next-line prefer-arrow/prefer-arrow-functions
    notify(action, type, _ids, _extraData) {
      const readers = Zotero.Reader._readers;
      if (!(action === "add" && type === "tab" && readers?.length > 0)) return;
      revertPatch = around(readers[readers.length - 1].constructor.prototype, {
        _openAnnotationPopup: (next) =>
          function (data: ReaderData) {
            const result = next.call(this, data);
            const attachment = Zotero.Items.get(this._itemID);
            let annots;
            addMenuItem(this, data, () => {
              if (!annots)
                annots = data.ids.map((key) =>
                  Zotero.Items.getByLibraryAndKey(attachment.libraryID, key),
                );
              return annots;
            });
            return result;
          },
      });
      if (notifierID !== null) {
        Zotero.Notifier.unregisterObserver(notifierID);
        Zotero.log("annotation popup patched");
      }
    },
  };
  notifierID = Zotero.Notifier.registerObserver(
    notifier,
    ["tab"],
    "annot-popup-patch",
  );

  return () => {
    revertPatch && revertPatch();
    notifierID !== null && Zotero.Notifier.unregisterObserver(notifierID);
  };
};

export default patchReaderInstance;
