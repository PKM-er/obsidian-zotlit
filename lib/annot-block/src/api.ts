export interface AnnotBlockWorkerAPI {
  parse(markdown: string): BlockInfo;
  stringify(spec: AnnotDetails[]): string;
}

export interface AnnotDetails extends AnnotInfo {
  text: string;
}

export interface BlockInfo {
  annots: AnnotInfo[];
  withoutLinks: string;
}
export interface AnnotInfo {
  annotKey: string;
  fallback: string;
  url: string;
  alt: string | null;
  altType: "text" | "code";
}

type ToWorkpoolType<API extends AnnotBlockWorkerAPI> = {
  [K in keyof API]: API[K] extends (...args: infer P) => infer R
    ? (...args: P) => Promise<Awaited<R>>
    : never;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
};

export type AnnotBlockWorkerAPIWorkpool = ToWorkpoolType<AnnotBlockWorkerAPI>;
