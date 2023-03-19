const optionalByteOrderMark = "\\ufeff?";
const platform = typeof process !== "undefined" ? process.platform : "";
const pattern =
  "^(" +
  optionalByteOrderMark +
  "(= yaml =|---)" +
  "$([\\s\\S]*?)" +
  "^(?:\\2|\\.\\.\\.)\\s*" +
  "$" +
  (platform === "win32" ? "\\r?" : "") +
  "(?:\\n)?)";
// NOTE: If this pattern uses the 'g' flag the `regex` variable definition will
// need to be moved down into the functions that use it.
const regex = new RegExp(pattern, "m");

export function extractFrontmatter(string: string): {
  yaml: string | null;
  body: string;
  bodyBegin: number;
} {
  string = string || "";
  const lines = string.split(/(\r?\n)/);
  if (lines[0] && /= yaml =|---/.test(lines[0])) {
    return parse(string);
  } else {
    return {
      yaml: null,
      body: string,
      bodyBegin: 1,
    };
  }
}

function computeLocation(match: RegExpExecArray, body: string) {
  let line = 1;
  let pos = body.indexOf("\n");
  const offset = match.index + match[0].length;

  while (pos !== -1) {
    if (pos >= offset) {
      return line;
    }
    line++;
    pos = body.indexOf("\n", pos + 1);
  }

  return line;
}

function parse(string: string) {
  const match = regex.exec(string);
  if (!match) {
    return {
      yaml: null,
      body: string,
      bodyBegin: 1,
    };
  }

  const yaml = match[match.length - 1].replace(/^\s+|\s+$/g, "");
  const body = string.replace(match[0], "");
  const line = computeLocation(match, string);

  return {
    yaml,
    body: body,
    bodyBegin: line,
  };
}

export function hasFrontmatter(string: string) {
  string = string || "";

  return regex.test(string);
}
