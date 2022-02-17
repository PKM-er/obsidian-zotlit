// From https://github.com/sindresorhus/filenamify/blob/main/filenamify.js

import filenameReservedRegex, {
  windowsReservedNameRegex,
} from "filename-reserved-regex";
import stripOuter from "strip-outer";
import trimRepeated from "trim-repeated";

// Doesn't make sense to have longer filenames
const MAX_FILENAME_LENGTH = 100;

const reControlChars = /[\u0000-\u001F\u0080-\u009F]/g; // eslint-disable-line no-control-regex
const reRelativePath = /^\.+/;
const reTrailingPeriods = /\.+$/;

const filenamify = (string, options = {}) => {
  if (typeof string !== "string") {
    throw new TypeError("Expected a string");
  }

  const replacement =
    options.replacement === undefined ? "!" : options.replacement;

  if (
    filenameReservedRegex().test(replacement) &&
    reControlChars.test(replacement)
  ) {
    throw new Error(
      "Replacement string cannot contain reserved filename characters",
    );
  }

  string = string.normalize("NFD");
  string = string.replace(filenameReservedRegex(), replacement);
  string = string.replace(reControlChars, replacement);
  string = string.replace(reRelativePath, replacement);
  string = string.replace(reTrailingPeriods, "");

  if (replacement.length > 0) {
    string = trimRepeated(string, replacement);
    string = string.length > 1 ? stripOuter(string, replacement) : string;
  }

  string = windowsReservedNameRegex().test(string)
    ? string + replacement
    : string;
  const allowedLength =
    typeof options.maxLength === "number"
      ? options.maxLength
      : MAX_FILENAME_LENGTH;
  if (string.length > allowedLength) {
    const extensionIndex = string.lastIndexOf(".");
    string =
      string.slice(0, Math.min(allowedLength, extensionIndex)) +
      string.slice(extensionIndex);
  }

  return string;
};

export default filenamify;
