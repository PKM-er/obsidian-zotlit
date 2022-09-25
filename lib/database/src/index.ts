import dbWorker from "worker:./worker.ts";

export default function getDbWorker() {
  return URL.createObjectURL(new Blob([dbWorker], { type: "text/javascript" }));
}

export type { DbWorkerAPIWorkpool as DbWorkerAPI } from "./api.js";
