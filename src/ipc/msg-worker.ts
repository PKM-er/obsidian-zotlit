type MsgSentWithData = {};
// type MsgSent = "dosomthing";

interface MsgInvoked {
  // hello: [[msg: string], [reply: string]];
}

export type MsgFromDbWorker = {
  [K in keyof MsgSentWithData]: [MsgSentWithData[K]];
} & {
  //   [K in MsgSent]: [[]];
  // } & {
  [K in keyof MsgInvoked as `cb:${K}`]: MsgInvoked[K];
};
