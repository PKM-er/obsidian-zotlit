import log from "@log";

export function attachLogger<F extends (...args: any[]) => any>(
  fn: F,
  task:
    | string
    | ((val: Awaited<ReturnType<F>> | null, ...args: Parameters<F>) => string),
): F {
  return ((...args: Parameters<F>) => {
    log.debug(
      `Reading Zotero database for ${
        typeof task === "string" ? task : task(null, ...args)
      }`,
    );
    // eslint-disable-next-line prefer-spread
    const result = fn.apply(null, args);
    Promise.resolve(result).then((val) =>
      log.debug(
        `Finished reading Zotero database for ${
          typeof task === "string" ? task : task(val, ...args)
        }`,
      ),
    );
    return result;
  }) as F;
}
