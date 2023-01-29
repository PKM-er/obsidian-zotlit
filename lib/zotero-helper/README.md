- https://github.com/zotero/make-it-red
- https://github.com/windingwind/zotero-plugin-template/
- https://www.zotero.org/support/dev/zotero_7_for_developers
- https://www.zotero.org/support/dev/client_coding/plugin_development#setting_up_a_plugin_development_environment

---

In package.json, icon paths should be relative to the content uri path set in chrome.manifest

---

chrome.manifest documentation: https://firefox-source-docs.mozilla.org/build/buildsystem/chrome-registration.html

plugin name for skin, locale and content can use placeholder _ to generate from package.json

---

`zt-bundle --outdir dist main.ts` will create a xpi file in `dist` folder, with assets in `public` folder copied to dist folder.