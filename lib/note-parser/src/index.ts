import noteParserWorker from "worker:./worker.ts";

export default function getNoteParserWorker() {
  return noteParserWorker;
  // const blobUrl = URL.createObjectURL(
  //   new Blob([noteParserWorker], { type: "text/javascript" }),
  // );
  // return blobUrl;
}

export type { NoteParserWorkerAPIWorkpool as NoteParserWorkerAPI } from "./api.js";
