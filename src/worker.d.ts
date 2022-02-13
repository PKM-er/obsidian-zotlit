declare module "*.worker.ts" {
  const WorkerFactory: new () => Worker;
  export default WorkerFactory;
}
declare module "*.sql" {
  const sql: string;
  export default sql;
}
