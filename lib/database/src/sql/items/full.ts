import { Prepared } from "../../utils/index.js";
import type { Output } from "./base.js";
import { sql } from "./base.js";

const query = sql("full");
interface Input {
  libId: number;
}

export class ItemsFull extends Prepared<Output, Input> {
  sql(): string {
    return query;
  }
}
