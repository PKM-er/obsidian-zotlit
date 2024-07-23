import type { DB } from "@obzt/zotero-type";
import { PreparedNoInput } from "../../utils/index.js";

const query = `--sql
SELECT
  libraries.libraryID,
  groups.groupID,
  CASE
    libraries.type
    WHEN 'user' THEN 'My Library'
    WHEN 'group' THEN groups.name
    ELSE NULL
  END AS name
FROM
  libraries
  LEFT JOIN groups USING (libraryID)
WHERE
  libraries.libraryID IS NOT NULL
ORDER BY
  libraryID
`;

export interface Output {
  libraryID: Exclude<DB.Libraries["libraryID"], null>;
  groupID: DB.Groups["groupID"];
  name: string | null;
}

export class LibrariesFull extends PreparedNoInput<Output> {
  sql(): string {
    return query;
  }
}

