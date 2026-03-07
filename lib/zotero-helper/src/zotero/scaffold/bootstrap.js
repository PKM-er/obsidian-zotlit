/**
 * @see http://www.devdoc.net/web/developer.mozilla.org/en-US/docs/Mozilla/Add-ons/Bootstrapped_Extensions.html#Bootstrap_entry_points
 */

import "core-js/actual/global-this.js";
/* global globalThis, dump, ChromeUtils, Components */
// define global variable if it doesn't exist
let Zotero = globalThis.Zotero;
let Services = globalThis.Services;

import pluginCtor from "@plugin";
import { NS, styleCss } from "../../const.js";
import { getChromeManifest } from "../helper.js";

/** @type {pluginCtor} */
let plugin;

export async function install() {
  await waitForZotero();
  plugin ??= new pluginCtor(Zotero);
  await plugin.install();
}

export async function startup({
  id,
  version,
  resourceURI,
  rootURI = resourceURI.spec,
}) {
  await waitForZotero();

  plugin ??= new pluginCtor(Zotero);
  plugin.register(registerChromeManifest(rootURI));
  await plugin.load({ id, version, resourceURI, rootURI }, Services);

  // load stylesheet
  /** @type {Window} */
  const win = Zotero.getMainWindow();
  if (win && win.ZoteroPane) {
    const doc = win.document;
    const css = doc.createElement("link");
    css.type = "text/css";
    css.rel = "stylesheet";
    css.href = rootURI + styleCss;
    doc.documentElement.appendChild(css);
    plugin.register(() => css.remove());
  }
}

export async function shutdown() {
  dump("shutdown " + !!plugin);
  await plugin?.unload();
}

export async function uninstall() {
  dump("uninstall " + !!plugin);
  await plugin?.uninstall();
}

// Import Services, supporting both Zotero 7 (JSM) and Zotero 8+ (ESM)
function registerServices() {
  if (Services) return;
  try {
    // importESModule and .sys.mjs paths work in both Zotero 7 and 8
    Services = ChromeUtils.importESModule(
      "resource://gre/modules/Services.sys.mjs",
    ).Services;
  } catch (e) {
    // Fallback for older Zotero 7 builds that may not have importESModule
    Services = ChromeUtils.import(
      "resource://gre/modules/Services.jsm",
    ).Services;
  }
}

// In Zotero 7+, bootstrap methods are not called until Zotero is initialized,
// and the 'Zotero' global is automatically made available.
async function waitForZotero() {
  registerServices();
  if (typeof Zotero != "undefined") {
    await Zotero.initializationPromise;
    return;
  }
  // Zotero global should always be available in Zotero 7+.
  // If somehow not, throw an informative error.
  throw new Error(
    "Zotero global not available. This plugin requires Zotero 7 or later.",
  );
}

/**
 * @see https://www.zotero.org/support/dev/zotero_7_for_developers#chromemanifest_runtime_chrome_registration
 */
function registerChromeManifest(rootURI) {
  const chromeManifest = getChromeManifest(rootURI);
  if (chromeManifest.length === 0) return;
  const aomStartup = Components.classes[
    "@mozilla.org/addons/addon-manager-startup;1"
  ].getService(Components.interfaces.amIAddonManagerStartup);
  const manifestURI = Services.io.newURI(rootURI + "manifest.json");
  const chromeHandle = aomStartup.registerChrome(manifestURI, chromeManifest);
  return () => chromeHandle.destruct();
}
