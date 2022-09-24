declare module "web-worker:*" {
  const dbWorker: (name: string, configDirPathFull: string) => Worker;
  export default dbWorker;
}
