/**
 * @param script code of worker script
 */
export const toObjectURL = (script: string): string => {
  const blob = new Blob([script], { type: "text/javascript" });
  const url = URL.createObjectURL(blob);
  return url;
};

/**
 * @param script code of worker script
 */
export const fromScriptText = (script: string, options: WorkerOptions): Worker => {
  const url = toObjectURL(script);
  const worker = new Worker(url, options);
  URL.revokeObjectURL(url);
  return worker;
};

export const fromDataURI = (uri: string, options: WorkerOptions): Worker => {
  const worker = new Worker(uri, options);
  return worker;
};
