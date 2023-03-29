import type { AttachmentInfo } from "@obzt/database";
import { getAttachmentPath } from "../utils";
import type { Context } from "./base";
import { zoteroDataDir } from "./base";

export type AttachmentHelper = Readonly<
  AttachmentInfo & {
    fullname: string;
  }
>;

// eslint-disable-next-line @typescript-eslint/naming-convention
const Proxied = Symbol("proxied");

export const isProxied = (obj: AttachmentInfo): boolean =>
  !!(obj as any)[Proxied];

export const withAttachmentHelper = (data: AttachmentInfo, ctx: Context) =>
  new Proxy(
    {
      get filePath(): string {
        return getAttachmentPath(zoteroDataDir(ctx), data);
      },
    },
    {
      get(target, p, receiver) {
        if (p === Proxied) return true;
        return (
          Reflect.get(data, p, receiver) ?? Reflect.get(target, p, receiver)
        );
      },
      ownKeys(target) {
        return [...Reflect.ownKeys(data), ...Reflect.ownKeys(target)];
      },
      getOwnPropertyDescriptor(target, prop) {
        if (Object.prototype.hasOwnProperty.call(data, prop)) {
          return Reflect.getOwnPropertyDescriptor(data, prop);
        }
        return Reflect.getOwnPropertyDescriptor(target, prop);
      },
    },
  ) as unknown as AttachmentHelper;
