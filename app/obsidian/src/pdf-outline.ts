import { execFile as _execFile } from "child_process";
import { promisify } from "util";
import queryString from "query-string";
import log from "./logger";
const execFile = promisify(_execFile);

export interface PDFOutline {
  leading: string;
  level: number;
  page: number;
  title: string;
  zoom: number[];
}

export const getPDFOutline = async (pdfPath: string, mutool: string) => {
  try {
    const { stdout, stderr } = await execFile(mutool, [
      "show",
      pdfPath,
      "outline",
    ]);
    if (stderr) {
      throw new Error(stderr);
    }
    if (stdout) {
      return parseResult(stdout);
    }
  } catch (error) {
    log.error(error);
  }
  return null;
};

const parseResult = (result: string) =>
  result.split("\n").map((line) =>
    line
      .trim()
      .split("\t")
      .reduce(
        (record, field, i, arr) => {
          if (i === 0) {
            record.leading = field;
          } else if (i === arr.length - 1) {
            Object.assign(
              record,
              queryString.parse(field, {
                arrayFormat: "comma",
                parseNumbers: true,
              }),
            );
          } else if (i === arr.length - 2) {
            record.title = field.replace(/^"|"$/g, "").replace('"', '"');
          } else if (field === "") {
            record.level += 1;
          } else {
            log.warn("unknown field", field, i, arr);
          }
          return record;
        },
        { level: 0 } as PDFOutline,
      ),
  );
