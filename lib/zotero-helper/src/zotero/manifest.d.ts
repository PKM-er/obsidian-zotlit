declare module "@manifest" {
  export const id: string;
  export const idShort: string;
  export const version: string;
  /** icon path relative to root */
  export const icons: Record<string, string>;
}
