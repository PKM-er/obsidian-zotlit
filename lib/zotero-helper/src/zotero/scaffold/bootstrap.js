/**
 * @see http://www.devdoc.net/web/developer.mozilla.org/en-US/docs/Mozilla/Add-ons/Bootstrapped_Extensions.html#Bootstrap_entry_points
 */

import "core-js/actual/global-this.js";
/* global globalThis, dump, ChromeUtils, Ci, Components */
// define global variable if it doesn't exist
let Zotero = globalThis.Zotero;
let Services = globalThis.Services;

import pluginCtor from "@plugin";
import { NS, styleCss } from "../../const.js";
import { getChromeManifest, isZotero7 } from "../helper.js";

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

  // Read prefs from prefs.js when the plugin in Zotero 6
  if (!isZotero7(Zotero)) {
    setDefaultPrefs(rootURI);
  }

  plugin ??= new pluginCtor(Zotero);
  if (isZotero7(Zotero)) {
    plugin.register(registerChromeManifest(rootURI));
  }
  await plugin.load({ id, version, resourceURI, rootURI }, Services);

  // load stylesheet
  /** @type {Window} */
  const win = Zotero.getMainWindow();
  if (win && win.ZoteroPane) {
    const doc = win.document;
    // createElementNS() necessary in Zotero 6; createElement() defaults to HTML in Zotero 7
    const css = doc.createElementNS(NS.HTML, "link");
    css.type = "text/css";
    css.rel = "stylesheet";
    css.href = rootURI + styleCss;
    doc.documentElement.appendChild(css);
    plugin.register(() => css.remove());
  }

  // TODO: load locale
  // Use strings from make-it-red.properties (legacy properties format) in Zotero 6
  // and from make-it-red.ftl (Fluent) in Zotero 7
  // if (Zotero.platformMajorVersion < 102) {
  //   let stringBundle = Services.strings.createBundle(
  //     "chrome://make-it-red/locale/make-it-red.properties",
  //   );
  //   Zotero.getMainWindow()
  //     .document.getElementById("make-it-green-instead")
  //     .setAttribute(
  //       "label",
  //       stringBundle.GetStringFromName("makeItGreenInstead.label"),
  //     );
  // } else {
  //   let link2 = doc.createElementNS(HTML_NS, "link");
  //   link2.id = ftlID;
  //   link2.rel = "localization";
  //   link2.href = "make-it-red.ftl";
  //   doc.documentElement.appendChild(link2);
  // }
}

export async function shutdown() {
  dump("shutdown " + !!plugin);
  await plugin?.unload();
}

export async function uninstall() {
  dump("uninstall " + !!plugin);
  await plugin?.uninstall();
}

// 'Services' may not be available in Zotero 6
function registerServices() {
  Services ??= ChromeUtils.import(
    "resource://gre/modules/Services.jsm",
  ).Services;
}

// In Zotero 6, bootstrap methods are called before Zotero is initialized, and using include.js
// to get the Zotero XPCOM service would risk breaking Zotero startup. Instead, wait for the main
// Zotero window to open and get the Zotero object from there.
//
// In Zotero 7, bootstrap methods are not called until Zotero is initialized, and the 'Zotero' is
// automatically made available.
async function waitForZotero() {
  registerServices();
  if (typeof Zotero != "undefined") {
    await Zotero.initializationPromise;
    return;
  }

  let windows = Services.wm.getEnumerator("navigator:browser");
  let found = false;
  while (windows.hasMoreElements()) {
    let win = windows.getNext();
    if (win.Zotero) {
      Zotero = win.Zotero;
      found = true;
      break;
    }
  }
  if (!found) {
    await new Promise((resolve) => {
      const listener = {
        onOpenWindow: (aWindow) => {
          // Wait for the window to finish loading
          let domWindow = aWindow
            .QueryInterface(Ci.nsIInterfaceRequestor)
            .getInterface(Ci.nsIDOMWindowInternal || Ci.nsIDOMWindow);
          domWindow.addEventListener(
            "load",
            () => {
              if (!domWindow.Zotero) return;
              Services.wm.removeListener(listener);
              Zotero = domWindow.Zotero;
              resolve();
            },
            { capture: false, once: true },
          );
        },
      };
      Services.wm.addListener(listener);
    });
  }
  await Zotero.initializationPromise;
}

// Loads default preferences from prefs.js in Zotero 6
function setDefaultPrefs(rootURI) {
  let branch = Services.prefs.getDefaultBranch("");
  let obj = {
    pref(pref, value) {
      switch (typeof value) {
        case "boolean":
          branch.setBoolPref(pref, value);
          break;
        case "string":
          branch.setStringPref(pref, value);
          break;
        case "number":
          branch.setIntPref(pref, value);
          break;
        default:
          Zotero.logError(`Invalid type '${typeof value}' for pref '${pref}'`);
      }
    },
  };
  Services.scriptloader.loadSubScript(rootURI + "prefs.js", obj);
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
