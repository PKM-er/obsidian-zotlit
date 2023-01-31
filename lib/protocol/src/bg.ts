export interface INotifyRegularItem {
  event: "regular-item/add";
  ids: string[];
}

export type INotify = INotifyRegularItem;
