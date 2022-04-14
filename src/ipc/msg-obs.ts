import type Fuse from "fuse.js";
import type { LogLevelNumbers } from "loglevel";

import type { RegularItem } from "../zotero-types";

type MsgSentWithData = {
  setLogLevel: [LogLevelNumbers];
};
// type MsgSent = "dosomthing";

interface MsgInvoked {
  // open new database, return true if successful
  openDb: [[mainDbPath: string, bbtDbPath: string], [result: boolean]];
  // start index for library, need to be called before query and after openDb
  initIndex: [[libraryID: number, refresh?: boolean], []];
  query: [
    [
      libraryID: number,
      pattern: string | Fuse.Expression | null,
      options?: Fuse.FuseSearchOptions,
    ],
    [result: Fuse.FuseResult<RegularItem>[]],
  ];
  // need to be called after openDb
  getLibs: [[], [libs: { libraryID: number; name: string }[]]];
}

export type MsgFromObsidian = {
  [K in keyof MsgSentWithData]: [MsgSentWithData[K]];
} & {
  //   [K in MsgSent]: [[]];
  // } & {
  [K in keyof MsgInvoked as `cb:${K}`]: MsgInvoked[K];
};
