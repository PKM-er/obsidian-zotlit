/* eslint-disable @typescript-eslint/no-explicit-any */

export type FromKnex<Q extends (...args: any[]) => any> = Awaited<
  ReturnType<Q>
> extends (infer V)[]
  ? V
  : never;
