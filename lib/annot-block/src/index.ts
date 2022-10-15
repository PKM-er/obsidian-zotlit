import annotBlockWorker from "worker:./worker.ts";

export default function getAnnotBlockWorker() {
  const blobUrl = URL.createObjectURL(
    new Blob([annotBlockWorker], { type: "text/javascript" }),
  );
  return blobUrl;
}

export type {
  AnnotBlockWorkerAPIWorkpool as AnnotBlockWorkerAPI,
  AnnotDetails,
  BlockInfo,
  AnnotInfo,
} from "./api.js";
