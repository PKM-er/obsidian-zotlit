/**
 * @returns {string}
 */
export const getConfigDirFunc = () =>
    app.vault.adapter.getFullPath(app.vault.configDir),
  getConfigDirCode = `(${getConfigDirFunc.toString()})()`,
  libName = `better-sqlite3.node`;
