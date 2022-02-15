import { Worker as WorkerThread, WorkerOptions } from "worker_threads";
declare module "worker-thread:*" {
  const WorkerFactory: (
    options: WorkerOptions,
    configDirPathFull: string,
  ) => WorkerThread;
  export default WorkerFactory;
}
