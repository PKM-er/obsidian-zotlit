export interface NoteParserWorkerAPI {
  parse(html: string): string;
}
