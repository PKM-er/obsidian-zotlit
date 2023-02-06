import type { Emitter } from "nanoevents";

/**
 * Searched using /Notifier\.(?:\w+)\(\s*'/ in Zotero source code
 */

// const result = pipe(
//   list,
//   A.groupBy((item) => item[1]),
//   D.map((vals) =>
//     pipe(
//       vals,
//       A.map(([t]) => `${t}`),
//       A.uniq,
//       A.sort((a, b) => a.localeCompare(b)),
//       A.join("' | '"),
//     ),
//   ),
// );

interface ZoteroEventTypeMap {
  tab: "add" | "close" | "select";
  file: "download" | "open";
  item:
    | "add"
    | "index"
    | "modify"
    | "redraw"
    | "refresh"
    | "removeDuplicatesMaster"
    | "trash"
    | "unknown";
  collection: "add" | "delete" | "redraw";
  setting: "delete";
  trash: "refresh";
  feed: "delete" | "statusChanged" | "unreadCountUpdated";
  group: "add" | "delete" | "modify";
  search: "add" | "modify";
  "item-tag": "remove";
  tag: "delete";
  "api-key": "delete" | "modify";
  sync: "finish" | "start";
}

export type ZoteroEvents = keyof ZoteroEventTypeMap;

export type ZoteroEventMap<T extends ZoteroEvents> = Record<
  ZoteroEventTypeMap[T],
  (ids: string[], extraData: _ZoteroTypes.anyObj) => any
>;

export type ZoteroEventWarpper = {
  [K in ZoteroEvents]: Emitter<ZoteroEventMap<K>>;
};
