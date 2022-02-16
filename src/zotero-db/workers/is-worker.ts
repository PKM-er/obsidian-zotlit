declare global {
  const WorkerGlobalScope: any;
}

const isWorker = () =>
  typeof WorkerGlobalScope !== "undefined" && self instanceof WorkerGlobalScope;

export default isWorker;
