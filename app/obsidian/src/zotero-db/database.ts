import { Service } from "@ophidian/core";
import type Fuse from "fuse.js";
import { debounce, Notice } from "obsidian";
import prettyHrtime from "pretty-hrtime";
import log from "@log";
import DatabaseWatcher from "./auto-refresh/service";
import DatabaseWorker from "./connector/service";
import { DatabaseSettings } from "./connector/settings";

export class ZoteroDatabase extends Service {
  async onload() {
    const onDatabaseUpdate = debounce(
      this.#refreshDbConn.bind(this),
      500,
      true,
    );
    app.vault.on("zotero:db-updated", onDatabaseUpdate);
    await this.init();
  }

  onunload(): void {
    log.info("ZoteroDB unloaded");
  }

  get defaultLibId() {
    return this.settings.citationLibrary;
  }

  settings = this.use(DatabaseSettings);
  #worker = this.use(DatabaseWorker);

  watcher = this.use(DatabaseWatcher);
  get api() {
    return this.#worker.api;
  }

  async search(
    query: string[],
    matchField: string,
    limit = 20,
    lib = this.defaultLibId,
  ) {
    await this.initIndex();
    const exp = query.map<Fuse.Expression>((s) => ({
      [matchField]: s,
    }));
    const result = await this.api.query(lib, { $and: exp }, { limit });
    return result;
  }
  async getAll(limit = 20, lib = this.defaultLibId) {
    await this.initIndex();
    const result = await this.api.query(lib, null, { limit });
    return result;
  }

  /** calling this will reload database worker */
  async init() {
    const start = process.hrtime();
    const [mainOpened, bbtOpened] = await this.openDbConn();
    if (!bbtOpened) {
      log.debug("Failed to open Better BibTeX database, skipping...");
      // return;
    }
    if (mainOpened) {
      await this.initIndex(true);
    } else {
      throw new Error("Failed to init ZoteroDB");
    }

    new Notice("ZoteroDB Initialization complete.");
    log.debug(
      `ZoteroDB Initialization complete. Took ${prettyHrtime(
        process.hrtime(start),
      )}`,
    );
  }

  #dbInited = false;
  #initDbTask: Promise<[mainDbResult: boolean, bbtDbResult: boolean]> | null =
    null;
  #waitingInitDb = false;
  async #refreshDbConn() {
    let result = await this.api.refreshDb();

    if (!this.#waitingInitDb) {
      log.debug("no waiting task in queue, resolve init db task");
      // connection refresh done
    } else {
      this.#waitingInitDb = false;
      log.debug("current task done, continue init db task in queue");
      // continue to query
      result = await this.#refreshDbConn();
    }
    log.debug("refresh db conn done");
    app.vault.trigger("zotero:db-refresh");
    return result;
  }
  async #openDbConn() {
    if (this.#dbInited) {
      log.debug(
        `Database already initialized, reopen with new params: ${this.settings.dbConnParams}`,
      );
    }
    const result = await this.api.openDb(...this.settings.dbConnParams);
    log.debug("open db conn done");
    return result;
  }

  async #execOpenDbConnTask(
    refresh: boolean,
    pending: Promise<[mainDbResult: boolean, bbtDbResult: boolean]> | null,
  ) {
    let result;
    if (pending) {
      if (!refresh) {
        log.warn("Database already initializing");
      } else {
        log.debug("Database already initializing, send to queue");
        this.#waitingInitDb = true;
      }
      result = await pending;
      log.debug("pending init db task done");
    } else {
      if (!refresh) {
        result = await this.#openDbConn();
        this.#dbInited = true;
      } else {
        result = await this.#refreshDbConn();
      }
      this.#indexed = false;
    }
    return result;
  }

  openDbConn(
    refresh = false,
  ): Promise<[mainDbResult: boolean, bbtDbResult: boolean]> {
    const task = this.#execOpenDbConnTask(refresh, this.#initDbTask).finally(
      () => (this.#initDbTask = null),
    );
    this.#initDbTask = task;
    return task;
  }

  #indexed = false;
  async #initIndex(lib = this.defaultLibId) {
    await this.api.initIndex(lib);
  }
  private initIndexTask: Promise<void> | null = null;
  get #initIndexTask() {
    return this.initIndexTask;
  }
  set #initIndexTask(val) {
    this.initIndexTask = val;
  }
  async #execInitIndexTask(force: boolean, pending: Promise<void> | null) {
    // if db conn is initializing, continue after it's done
    if (this.#initDbTask) {
      await this.#initDbTask;
      log.debug("pending init db task finished");
    }
    if (pending) {
      await pending;
      log.debug("pending initIndex task finished");
    }
    let result;
    if (this.#indexed && !force) {
      // since database is opened as immutable one
      // if index is already initialized, skip
      result = void 0;
      log.debug("Index already initialized, skip");
    } else {
      log.debug("Index not initialized after init db, start indexing");
      result = await this.#initIndex();
      this.#indexed = true;
      log.debug("Index initialized");
    }
    return result;
  }
  async initIndex(force = false): Promise<void> {
    const task = this.#execInitIndexTask(force, this.#initIndexTask).finally(
      () => (this.initIndexTask = null),
    );
    this.#initIndexTask = task;
    return task;
  }

  async fullRefresh() {
    await this.openDbConn();
    await this.initIndex();
  }
}

declare module "obsidian" {
  interface Vault {
    /**
     * @public
     */
    on(name: "zotero:db-refresh", callback: () => any, ctx?: any): EventRef;
    trigger(name: "zotero:db-refresh"): void;
  }
}
