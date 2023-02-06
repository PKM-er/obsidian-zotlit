export interface INotifyRegularItem {
  event: "regular-item/add";
  ids: [id: number, lib: number][];
}

export interface INotifyReaderAnnotSelect {
  event: "reader/annot-select";
  updates: [id: number, selected: boolean][];
}

export type INotify = INotifyRegularItem | INotifyReaderAnnotSelect;
