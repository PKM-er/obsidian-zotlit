declare module "web-worker:*" {
  const WorkerFactory: (name: string, configDirPathFull: string) => Worker;
  export default WorkerFactory;
}
