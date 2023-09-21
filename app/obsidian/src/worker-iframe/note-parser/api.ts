export type NoteParserWorkerAPI = {
  parse(html: string): {
    content: string;
    colored: {
      color: string;
      key: string;
    }[];
    citations: {
      text: string;
      itemKeys: string[];
      key: string;
    }[];
  } | null;
};
