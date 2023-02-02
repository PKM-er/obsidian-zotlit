// @ts-check
/**
 *
 * @param {string} scriptText
 * @param {WorkerOptions} options
 * @returns {Worker}
 */
export const fromScriptText = (scriptText, options) => {
  const blob = new Blob([scriptText], { type: "text/javascript" });
  const url = URL.createObjectURL(blob);
  const worker = new Worker(url, options);
  URL.revokeObjectURL(url);
  return worker;
};

/**
 *
 * @param {string} uri
 * @param {WorkerOptions} options
 * @returns {Worker}
 */
export const fromDataURI = (uri, options) => {
  const worker = new Worker(uri, options);
  return worker;
};
