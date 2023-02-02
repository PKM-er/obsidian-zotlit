export interface INotifyRegularItem {
  event: "regular-item/add";
  ids: [id: number, lib: number][];
}

export type INotify = INotifyRegularItem;
