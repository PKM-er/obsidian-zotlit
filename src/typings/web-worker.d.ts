declare module "web-worker:*" {
  const WorkerFactory: (configDirPathFull: string) => Worker;
  export default WorkerFactory;
}
