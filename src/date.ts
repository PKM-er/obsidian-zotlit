// https://github.com/zotero/utilities/blob/37e33ba87a47905441baaafb90999abbb4ab6b1e/date.js#L665-L717

// Regexes for multipart and SQL dates
// Allow zeroes in multipart dates
// TODO: Allow negative multipart in DB and here with \-?
const _multipartRE = /^[0-9]{4}\-(0[0-9]|10|11|12)\-(0[0-9]|[1-2][0-9]|30|31) /;
const _sqldateRE =
  /^\-?[0-9]{4}\-(0[1-9]|10|11|12)\-(0[1-9]|[1-2][0-9]|30|31)$/;
const _sqldateWithZeroesRE =
  /^\-?[0-9]{4}\-(0[0-9]|10|11|12)\-(0[0-9]|[1-2][0-9]|30|31)$/;
const _sqldatetimeRE =
  /^\-?[0-9]{4}\-(0[1-9]|10|11|12)\-(0[1-9]|[1-2][0-9]|30|31) ([0-1][0-9]|[2][0-3]):([0-5][0-9]):([0-5][0-9])$/;
const _sqlDateTimeWithoutSecondsRE =
  /^\-?[0-9]{4}\-(0[1-9]|10|11|12)\-(0[1-9]|[1-2][0-9]|30|31) ([0-1][0-9]|[2][0-3]):([0-5][0-9])$/;

/**
 * Tests if a string is a multipart date string
 * e.g. '2006-11-03 November 3rd, 2006'
 */
export const isMultipart = (str: string): boolean => {
  if (isSQLDateTime(str) || isSQLDateTimeWithoutSeconds(str)) {
    return false;
  }
  return _multipartRE.test(str);
};

/**
 * Returns the SQL part of a multipart date string
 * (e.g. '2006-11-03 November 3rd, 2006' returns '2006-11-03')
 */
export const multipartToSQL = (multi: string | undefined): string => {
  if (!multi) {
    return "";
  }

  if (!isMultipart(multi)) {
    return "0000-00-00";
  }

  return multi.substring(0, 10);
};

/**
 * Returns the user part of a multipart date string
 * (e.g. '2006-11-03 November 3rd, 2006' returns 'November 3rd, 2006')
 */
export const multipartToStr = (multi: string): string => {
  if (!multi) {
    return "";
  }

  if (!isMultipart(multi)) {
    return multi;
  }

  return multi.substring(11);
};

const isSQLDateTime = (str: string) => {
  return _sqldatetimeRE.test(str);
};

const isSQLDateTimeWithoutSeconds = (str: string) => {
  return _sqlDateTimeWithoutSecondsRE.test(str);
};
