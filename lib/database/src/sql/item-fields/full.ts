import { Prepared } from "../../utils/index.js";
import type { Output } from "./base.js";
import { sql } from "./base.js";

const query = sql(true);

interface Input {
  libId: number;
}

export class ItemFieldsFull extends Prepared<Output, Input> {
  sql(): string {
    return query;
  }
}
