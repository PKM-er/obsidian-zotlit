export type MessageMap = Record<string, [sent: any[], callback?: any[]]>;

export interface MessageBasic {
  event: string;
  type: "send" | "req" | "res";
  data: any[] | string;
}

export type MsgSentBase<
  M extends MessageMap,
  E extends SentMsgNames<M> = SentMsgNames<M>,
> = {
  event: E;
  type: "send";
  data: M[E][0];
};
/** send message data */
export type MsgSent<M extends MessageMap> = {
  [E in SentMsgNames<M>]: MsgSentBase<M, E>;
}[SentMsgNames<M>];

export type MsgCallbackReqBase<
  M extends MessageMap,
  E extends InvokeMsgNames<M> = InvokeMsgNames<M>,
> = {
  event: E;
  type: "req";
  data: M[E][0];
  id: number;
};

/** invoke request data */
export type MsgCallbackReq<M extends MessageMap> = {
  [E in InvokeMsgNames<M>]: MsgCallbackReqBase<M, E>;
}[InvokeMsgNames<M>] & { id: number };

/** invoke response data format */
export type MsgCallbackRes<
  M extends MessageMap,
  E extends InvokeMsgNames<M> = InvokeMsgNames<M>,
> = {
  event: E;
  type: "res";
  data: MsgCallbackResData<M, E> | string /** error message */;
} & { id: number };
export type MsgCallbackResData<
  M extends MessageMap,
  E extends InvokeMsgNames<M> = InvokeMsgNames<M>,
> = M[E][1];

export type StateChangeMsgNames<
  M extends MessageMap,
  E extends keyof M = keyof M,
> = {
  [K in E]: M[K][0] extends [] ? K : never;
}[E];
export type MsgWithDataNames<
  M extends MessageMap,
  E extends keyof M = keyof M,
> = Exclude<E, StateChangeMsgNames<M, E>>;

export type InvokeMsgNames<M extends MessageMap> = {
  [K in keyof M]: M[K][1] extends undefined ? never : K;
}[keyof M];
export type MsgInvokeMap<M extends MessageMap> = Pick<M, InvokeMsgNames<M>>;

// export type MsgInvokeStateChange<M extends MessageMap> = MsgStateChange<
//   M,
//   MsgInvoke<M>
// >;
// export type MsgInvokeWithData<M extends MessageMap> = MsgWithData<
//   M,
//   MsgInvoke<M>
// >;

export type SentMsgNames<M extends MessageMap> = Exclude<
  keyof M,
  InvokeMsgNames<M>
>;
export type MsgSentMap<M extends MessageMap> = Omit<M, InvokeMsgNames<M>>;
