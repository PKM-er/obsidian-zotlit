import { around } from "monkey-around";

/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Used to emit error to console with proper sourcemap info
 */
export const logError = <T extends Record<string, any>>(methods: T): never => {
  const logger =
    (next: any) =>
    async (...args: any[]) => {
      try {
        return await next(...args);
      } catch (e) {
        console.error(e);
        throw e;
      }
    };
  around(
    methods,
    Object.fromEntries(
      Object.keys(methods).map((name) => [name, logger]),
    ) as never,
  );
  return methods as never;
};
