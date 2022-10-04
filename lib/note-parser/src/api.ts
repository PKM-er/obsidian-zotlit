export interface NoteParserWorkerAPI {
  parse(html: string): string;
}

type ToWorkpoolType<API extends NoteParserWorkerAPI> = {
  [K in keyof API]: API[K] extends (...args: infer P) => infer R
    ? (...args: P) => Promise<Awaited<R>>
    : never;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
};

export type NoteParserWorkerAPIWorkpool = ToWorkpoolType<NoteParserWorkerAPI>;
