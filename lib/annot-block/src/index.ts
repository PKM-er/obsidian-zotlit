import annotBlockWorker from "worker:./worker.ts";

export default function getAnnotBlockWorker() {
  return annotBlockWorker;
}

export type { AnnotBlockWorkerAPIWorkpool as AnnotBlockWorkerAPI } from "./api.js";
