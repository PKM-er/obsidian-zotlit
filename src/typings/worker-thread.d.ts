declare module "worker-thread:*" {
  const WorkerFactory: (
    options: import("worker_threads").WorkerOptions | undefined,
    configDirPathFull: string,
  ) => import("worker_threads").Worker;
  export default WorkerFactory;
}
