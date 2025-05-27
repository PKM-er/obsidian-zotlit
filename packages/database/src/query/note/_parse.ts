import type { NoteQueryRawResult } from "./_sql";

export type NoteQueryResult = {
  itemId: number;
  parentItemId: number | null;
  parentItemKey: string | null;
  note: string | null;
  title: string | null;
  groupId: number | null;
};

export function parseNote(result: NoteQueryRawResult): NoteQueryResult {
  return result;
}
