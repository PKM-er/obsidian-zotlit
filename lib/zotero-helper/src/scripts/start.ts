import "zx/globals";

import { resolve } from "path";
import { D } from "@mobily/ts-belt";
import { parse } from "yaml";
import { removeFromPref, addToPref, isZoterField } from "../utils.js";

/**
 * @see https://www.zotero.org/support/dev/client_coding/plugin_development#setting_up_a_plugin_development_environment
 */
export async function start({ log, plugins, profile, program }: Config) {
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
    const fileContent = await fs.readFile(pref, "utf-8");
    for (const [key, val] of D.toPairs(settings)) {
      val === null
        ? removeFromPref(fileContent, key)
        : addToPref(fileContent, key, val);
    }
    await fs.writeFile(pref, fileContent);
  }

  const packageJson = (await fs
    .readFile("package.json", "utf-8")
    .then(JSON.parse)) as Record<string, unknown>;

  if (!isZoterField(packageJson.zotero)) {
    throw new Error("Invalid zotero field in package.json");
  }

  const { id } = packageJson.zotero;

  const extensionsDir = path.join(profile.path, "extensions");

  // rm -rf ${extensionsDir}/${id}*
  await glob(`${extensionsDir}/${id}*`).then((files) =>
    Promise.all(files.map((f) => fs.rm(f, { force: true, recursive: true }))),
  );

  // Create a text file in the 'extensions' directory of your Zotero profile directory
  // named after the extension id (e.g., myplugin@mydomain.org)
  await fs.writeFile(path.join(extensionsDir, id), resolve(plugins.path));

  const logFile = path.resolve(Date.now() + (log.path ?? "zotero.log"));

  const zotero = $`${program.path} -purgecaches -P ${profile.name} -jsconsole -ZoteroDebugText -datadir profile >> ${logFile} 2>&1`;
  return { kill: () => zotero.kill() };
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
