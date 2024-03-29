import type { AttachmentInfo } from "@obzt/database";
import { getAttachmentPath } from "../utils";
import type { Context } from "./base";
import { isProxied, Proxied, zoteroDataDir } from "./base";

export type AttachmentHelper = Readonly<
  AttachmentInfo & {
    fullname: string;
  }
>;

export function withAttachmentHelper<T extends AttachmentInfo | null>(
  data: T,
  ctx: Context,
) {
  if (!data || isProxied(data)) return data;

  return new Proxy(
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
}
