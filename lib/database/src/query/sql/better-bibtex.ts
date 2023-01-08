import { PreparedNoInput } from "../utils";

const query = `--sql
SELECT
  itemID,
  citekey
FROM
  citekeys
`;

interface Output {
  itemID: number;
  citekey: string;
}

export class BetterBibtex extends PreparedNoInput<Output> {
  sql(): string {
    return query;
  }
}
