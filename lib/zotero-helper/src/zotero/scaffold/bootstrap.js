/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-undef */
/**
 * @see http://www.devdoc.net/web/developer.mozilla.org/en-US/docs/Mozilla/Add-ons/Bootstrapped_Extensions.html#Bootstrap_entry_points
 */

import pluginCtor from "@plugin";
import { setDefaultPrefs, waitForZotero } from "./utils.js";
import { styleCss } from "../../const.js";

/** @type {pluginCtor} */
let plugin;

async function install() {
  await waitForZotero();
  plugin = new pluginCtor(Zotero);
  await plugin.install();
}

async function startup({
  id,
  version,
  resourceURI,
  rootURI = resourceURI.spec,
}) {
  await waitForZotero();

  // 'Services' may not be available in Zotero 6
  if (typeof Services == "undefined") {
    var { Services } = ChromeUtils.import(
      "resource://gre/modules/Services.jsm",
    );
  }

  // Read prefs from prefs.js when the plugin in Zotero 6
  if (Zotero.platformMajorVersion < 102) {
    setDefaultPrefs(rootURI, Services);
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

async function shutdown() {
  dump("shutdown " + !!plugin);
  await plugin?.unload();
}

async function uninstall() {
  dump("uninstall " + !!plugin);
  await plugin?.uninstall();
}

// mark functions as exported to allow esbuild to bundle them
export { install, startup, shutdown, uninstall };
