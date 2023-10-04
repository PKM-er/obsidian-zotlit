import type {
  Server as HTTPServer,
  IncomingMessage,
  ServerResponse,
} from "http";
import { createServer } from "http";
import { queryActions } from "@obzt/protocol";
import type { INotify } from "@obzt/protocol/dist/bg";
import { Service, calc, effect } from "@ophidian/core";
import type { EventRef, ObsidianProtocolData } from "obsidian";
import { Events, Notice } from "obsidian";
import log from "@/log";
import { SettingsService, skip } from "@/settings/base";
import ZoteroPlugin from "@/zt-main";

/** background actions */
const bgActions = new Set<string>(["notify"]);
/** obsidian protocol actions */
const obActions = new Set<string>([...queryActions.map((v) => `zotero/${v}`)]);

export class Server extends Service implements Events {
  #events = new Events();

  settings = this.use(SettingsService);
  plugin = this.use(ZoteroPlugin);
  server: HTTPServer | null = null;

  @calc
  get port() {
    return this.settings.current?.serverPort;
  }

  @calc
  get hostname() {
    return this.settings.current?.serverHostname;
  }
  @calc
  get enableServer() {
    return this.settings.current?.enableServer;
  }
  onload() {
    this.register(
      effect(
        skip(
          () => {
            if (this.enableServer) {
              this.initServer();
            } else {
              this.closeServer();
            }
          },
          () => this.enableServer,
        ),
      ),
    );
    this.register(
      effect(
        skip(
          () => {
            this.reloadPort();
            new Notice("Server port is saved and applied.");
          },
          () => (this.port, this.hostname),
          true,
        ),
      ),
    );
    this.registerObsidianProtocolHandler();
  }
  onunload(): void {
    this.closeServer();
    this.server = null;
  }

  registerObsidianProtocolHandler() {
    const handler = (data: ObsidianProtocolData) => {
      const { action, ...params } = data;
      this.trigger(action, params);
    };
    for (const action of obActions) {
      this.plugin.registerObsidianProtocolHandler(action, handler);
    }
  }

  // #region server for handling background actions
  #createServer() {
    this.server ??= createServer((request, response) => {
      this.requestListener(request, response);
    });
  }
  #startListen() {
    if (this.server?.listening) return;
    this.server?.listen(this.port, this.hostname, () =>
      this.listeningListener(),
    );
  }
  initServer() {
    this.#createServer();
    this.#startListen();
  }
  closeServer() {
    this.server?.close();
  }
  reloadPort() {
    if (!this.enableServer) return;
    this.closeServer();
    this.#createServer();
    this.#startListen();
  }

  requestListener(request: IncomingMessage, response: ServerResponse) {
    if (!request.url) {
      log.error("Request without url");
      response.statusCode = 400;
      response.end();
      return;
    }

    log.trace(`server recieved req`, request.url, request.rawHeaders);

    const { pathname, searchParams } = new URL(
      request.url,
      `http://${request.headers.host}`,
    );

    // use pathname without leading slash as action name
    const action = pathname.substring(1),
      // use bg: prefix to avoid conflict with obsidian protocol actions
      event = `bg:${pathname.substring(1)}`;
    if (bgActions.has(action)) {
      const params = Object.fromEntries(searchParams.entries());
      if (request.headers["content-type"] === "application/json") {
        new Promise<unknown>((resolve, reject) => {
          let data = "";
          request.on("data", (chunk) => (data += chunk));
          request.on("error", (error) => reject(error));
          request.on("end", () => {
            try {
              resolve(JSON.parse(data));
            } catch (error) {
              reject(error);
            }
          });
        }).then((data) => {
          this.trigger(event, params, data);
          response.end();
        });
      } else {
        this.trigger(event, params);
        response.end();
      }
    } else {
      response.statusCode = 404;
      response.end();
    }
  }
  listeningListener() {
    if (!this.server) return;
    log.info(`Server is listening at ${logAddr(this.server)}`);
  }
  // #endregion

  // #region expose Events
  on(
    name: "bg:notify",
    callback: (param: Record<string, string>, data: INotify) => any,
    ctx?: any,
  ): EventRef;
  on(
    name: "zotero/open",
    callback: (param: Record<string, string>) => any,
    ctx?: any,
  ): EventRef;
  on(
    name: "zotero/export",
    callback: (param: Record<string, string>) => any,
    ctx?: any,
  ): EventRef;
  on(
    name: "zotero/update",
    callback: (param: Record<string, string>) => any,
    ctx?: any,
  ): EventRef;
  on(name: string, callback: (...data: any) => any, ctx?: any): EventRef {
    return this.#events.on(name, callback, ctx);
  }
  off(name: string, callback: (...data: any) => any) {
    return this.#events.off(name, callback);
  }
  offref(ref: EventRef) {
    return this.#events.offref(ref);
  }
  trigger(name: string, ...data: any[]) {
    log.trace(`server trigger ${name}`, ...data);
    return this.#events.trigger(name, ...data);
  }
  tryTrigger(evt: EventRef, args: any[]) {
    return this.#events.tryTrigger(evt, args);
  }
  // #endregion
}

function logAddr(server: HTTPServer) {
  const addr = server.address();
  if (!addr) return "?";
  if (typeof addr === "string") return addr;
  return `${addr.address}:${addr.port}`;
}
