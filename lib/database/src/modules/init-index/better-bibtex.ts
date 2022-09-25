import type { Knex } from "@knex";

const betterBibTexSql = (knex: Knex) =>
  knex.select("itemID", "citekey").from("citekeys");
export default betterBibTexSql;
