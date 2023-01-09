import dbWorker from "worker:./main.ts";

export default function getDbWorker() {
  return URL.createObjectURL(new Blob([dbWorker], { type: "text/javascript" }));
}
