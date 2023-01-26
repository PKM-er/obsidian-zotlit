/**
 * @see http://www.devdoc.net/web/developer.mozilla.org/en-US/docs/Mozilla/Add-ons/Bootstrapped_Extensions.html#Bootstrap_entry_points
 */

import "core-js/actual/global-this.js";
/* global globalThis, dump, ChromeUtils, Ci */
// define global variable if it doesn't exist
let Zotero = globalThis.Zotero;
let Services = globalThis.Services;

import pluginCtor from "@plugin";
import { styleCss } from "../../const.js";

/** @type {pluginCtor} */
let plugin;

export async function install() {
  await waitForZotero();
  plugin = new pluginCtor(Zotero);
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
  if (Zotero.platformMajorVersion < 102) {
    setDefaultPrefs(rootURI);
  }

  plugin ??= new pluginCtor(Zotero);
  await plugin.load({ id, version, resourceURI, rootURI }, Services);

  // load stylesheet
  const win = Zotero.getMainWindow();
  if (win && win.ZoteroPane) {
    let doc = win.document;
    // createElementNS() necessary in Zotero 6; createElement() defaults to HTML in Zotero 7
    let css = doc.createElementNS("http://www.w3.org/1999/xhtml", "link");
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
function registerService() {
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
  registerService();
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
