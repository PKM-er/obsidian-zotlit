import workerpool from "@aidenlx/workerpool";
import type { DbWorkerAPI } from "@obzt/database/dist/api";
import dbWorker from "@obzt/db-worker";
import { Service } from "@ophidian/core";
import logger, { LogSettings } from "@log";

const createWorkerProxy = (pool: workerpool.WorkerPool) => {
  const placeholder = {} as Record<string, any>;
  const addProxiedMethod = (name: string) =>
    (placeholder[name] ??= (...args: any[]) => pool.exec(name, args));

  pool
    // @ts-expect-error https://github.com/josdejong/workerpool/blob/11bd7fd37853626c265ae02de396f12436c2fc6c/src/Pool.js#L167-L171
    .exec("methods")
    .then((methods: string[]) => methods.forEach(addProxiedMethod));

  return new Proxy(placeholder, {
    get(_target, prop) {
      if (typeof prop !== "string") return undefined;
      // cache the resulting function
      return addProxiedMethod(prop);
    },
  }) as DbWorkerAPI;
};

export default class DatabaseWorker extends Service {
  logSettings = this.use(LogSettings);
  onload() {
    logger.debug("loading DatabaseWorker");
  }
  async onunload(): Promise<void> {
    await this.#instance.terminate();
    URL.revokeObjectURL(this.#url);
  }

  #url = dbWorker();
  #instance = workerpool.pool(this.#url, {
    minWorkers: 1,
    maxWorkers: 1,
    workerType: "web",
    name: "Zotero Database Workers",
  });

  api = createWorkerProxy(this.#instance);
}
