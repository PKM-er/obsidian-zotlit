import type Fuse from "fuse.js";
import type { LogLevelNumbers } from "loglevel";

import type { RegularItem } from "../zotero-types";

type MsgSentWithData = {
  setLogLevel: [LogLevelNumbers];
};
// type MsgSent = "dosomthing";

interface MsgInvoked {
  initDb: [[mainDbPath: string, bbtDbPath: string], [result: boolean]];
  initIndex: [[libraryID: number], [itemMap: Record<string, RegularItem>]];
  query: [
    [
      libraryID: number,
      pattern: string | Fuse.Expression | null,
      options?: Fuse.FuseSearchOptions,
    ],
    [result: Fuse.FuseResult<RegularItem>[]],
  ];
  getLibs: [[], [libs: { libraryID: number; name: string }[]]];
}

export type MsgFromObsidian = {
  [K in keyof MsgSentWithData]: [MsgSentWithData[K]];
} & {
  //   [K in MsgSent]: [[]];
  // } & {
  [K in keyof MsgInvoked as `cb:${K}`]: MsgInvoked[K];
};
