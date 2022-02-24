/**
 * @returns {string}
 */
module.exports.getConfigDirFunc = () =>
  app.vault.adapter.getFullPath(app.vault.configDir);
module.exports.getConfigDirCode = `app.vault.adapter.getFullPath(app.vault.configDir)`;
module.exports.libName = `better_sqlite3.node`;
