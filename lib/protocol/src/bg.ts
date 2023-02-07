export interface INotifyRegularItem {
  event: "regular-item/update";
  add: [id: number, lib: number][];
  modify: [id: number, lib: number][];
  trash: [id: number, lib: number][];
}

export interface INotifyReaderAnnotSelect {
  event: "reader/annot-select";
  updates: [id: number, selected: boolean][];
}

export interface INotifyActiveReader {
  event: "reader/active";
  itemId: number;
  attachmentId: number;
}

export type INotify =
  | INotifyRegularItem
  | INotifyReaderAnnotSelect
  | INotifyActiveReader;
