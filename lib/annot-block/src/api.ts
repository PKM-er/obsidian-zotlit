export interface AnnotBlockWorkerAPI {
  parse(markdown: string): void;
}

type ToWorkpoolType<API extends AnnotBlockWorkerAPI> = {
  [K in keyof API]: API[K] extends (...args: infer P) => infer R
    ? (...args: P) => Promise<Awaited<R>>
    : never;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
};

export type AnnotBlockWorkerAPIWorkpool = ToWorkpoolType<AnnotBlockWorkerAPI>;
