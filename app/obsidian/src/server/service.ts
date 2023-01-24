import type {
  Server as HTTPServer,
  IncomingMessage,
  ServerResponse,
} from "http";
import { createServer } from "http";
import { Service } from "@ophidian/core";
import type { EventRef, ObsidianProtocolData } from "obsidian";
import { Events } from "obsidian";
import log from "@log";
import ZoteroPlugin from "../zt-main";
import { ServerSettings } from "./settings";

/** background actions */
const bgActions = new Set<string>();
/** obsidian protocol actions */
const obActions = new Set<string>();

export class Server extends Service implements Events {
  #events = new Events();

  settings = this.use(ServerSettings);
  plugin = this.use(ZoteroPlugin);
  server: HTTPServer | null = null;

  get port() {
    return this.settings.serverPort;
  }
  onload() {
    if (this.settings.enableServer) {
      this.initServer();
    }
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
    this.server?.listen(this.port, "localhost", () => this.listeningListener());
  }
  initServer() {
    this.#createServer();
    this.#startListen();
  }
  closeServer() {
    this.server?.close();
  }
  reloadPort() {
    if (!this.settings.enableServer) return;
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

    const { pathname, searchParams } = new URL(
      request.url,
      `http://${request.headers.host}`,
    );

    // use pathname without leading slash as action name
    const action = pathname.substring(1);
    if (bgActions.has(action)) {
      const params = Object.fromEntries(searchParams.entries());
      // use bg: prefix to avoid conflict with obsidian protocol actions
      this.trigger(`bg:${pathname.substring(1)}`, params);
      response.end();
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
  on(name: string, callback: (...data: any) => any, ctx?: any) {
    return this.#events.on(name, callback, ctx);
  }
  off(name: string, callback: (...data: any) => any) {
    return this.#events.off(name, callback);
  }
  offref(ref: EventRef) {
    return this.#events.offref(ref);
  }
  trigger(name: string, ...data: any[]) {
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
