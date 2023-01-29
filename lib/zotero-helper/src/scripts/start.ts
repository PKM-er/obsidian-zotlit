import "zx/globals";

import { resolve } from "path";
import { D } from "@mobily/ts-belt";
import { parse } from "yaml";
import { getInfoFromPackageJson } from "../builder/parse.js";
import { removeFromPrefJs, addToPrefJs, toIdShort } from "../utils.js";

export function start(config: Config) {
  return {
    prepare: () => prepare(config),
    run: () => run(config),
  };
}

/**
 * @see https://www.zotero.org/support/dev/client_coding/plugin_development#setting_up_a_plugin_development_environment
 */
async function prepare({ plugins, profile }: Config) {
  const settings = {
    "extensions.autoDisableScopes": 0,
    "extensions.enableScopes": 15,
    "extensions.startupScanScopes": 15,
    "extensions.lastAppBuildId": null,
    "extensions.lastAppVersion": null,
    "extensions.zotero.debug.log": true,
  };
  for (const pref of ["user.js", "prefs.js"].map((pref) =>
    path.join(profile.path, pref),
  )) {
    if (!(await fs.pathExists(pref))) continue;
    let fileContent = await fs.readFile(pref, "utf-8");
    for (const [key, val] of D.toPairs(settings)) {
      fileContent =
        val === null
          ? removeFromPrefJs(fileContent, key)
          : addToPrefJs(fileContent, key, val);
    }
    await fs.writeFile(pref, fileContent);
  }

  const { id } = getInfoFromPackageJson(
    await fs.readFile("package.json", "utf-8").then(JSON.parse),
  );
  const extensionsDir = path.join(profile.path, "extensions");

  // rm -rf ${extensionsDir}/${id}*
  await glob(`${extensionsDir}/${toIdShort(id)}*`).then((files) =>
    Promise.all(files.map((f) => fs.rm(f, { force: true, recursive: true }))),
  );

  // Create a text file in the 'extensions' directory of your Zotero profile directory
  // named after the extension id (e.g., myplugin@mydomain.org)
  const placeholder = path.join(extensionsDir, id);
  await fs.ensureFile(placeholder);
  await fs.writeFile(placeholder, resolve(plugins.path));
}

function run({ log, profile, program }: Config) {
  const logFile = path.resolve(log.path ?? "zotero.log");
  const zotero = $`${program.path} -purgecaches -P ${profile.name} -jsconsole -debugger -ZoteroDebugText -datadir profile >> ${logFile} 2>&1`;
  return zotero;
}

export async function readStartConfig(file: string): Promise<Config> {
  const config = (await fs.readFile(file, "utf-8").then(parse)) as unknown;
  if (!isConfig(config)) {
    throw new Error("Missing fields in config file");
  }
  return config;
}

function isConfig(config: unknown): config is Config {
  if (!(typeof config === "object" && config !== null))
    throw new Error("Invalid config file");

  const { profile, log, plugins, program } = config as Config;

  return !!(
    profile?.name &&
    profile.path &&
    plugins?.path &&
    log?.path &&
    program?.path
  );
}

interface Config {
  program: {
    path: string;
  };
  profile: {
    name: string;
    path: string;
  };
  plugins: {
    path: string;
  };
  log: {
    path: string;
  };
}
