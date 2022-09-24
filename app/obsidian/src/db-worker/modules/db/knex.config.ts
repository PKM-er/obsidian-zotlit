import makeKnex from "@aidenlx/knex";

const isDev = process.env.NODE_ENV === "development";

const knex = (filename: string, binding: string) => {
  const knex = makeKnex(getKnexOptions(filename, binding));
  return knex;
};

export const getKnexOptions = (filename: string, binding: string) => ({
  client: "better-sqlite3",
  connection: {
    filename: `file:${filename}?mode=ro&immutable=1`,
    nativeBinding: binding,
    readonly: true,
  },
  useNullAsDefault: true,
  debug: isDev,
  pool: { min: 1, max: 1 },
});

export default knex;
export type Knex = ReturnType<typeof knex>;
