import { Knex } from "../db/knex.config";

const betterBibTexSql = (knex: Knex) =>
  knex.select("itemID", "citekey").from("citekeys");
export default betterBibTexSql;
