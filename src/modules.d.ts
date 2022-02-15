declare module "web-worker:*" {
  const WorkerFactory: (configDirPathFull: string) => Worker;
  export default WorkerFactory;
}
declare module "*.sql" {
  const sql: string;
  export default sql;
}
