- https://github.com/zotero/make-it-red
- https://github.com/windingwind/zotero-plugin-template/
- https://www.zotero.org/support/dev/zotero_7_for_developers
- https://www.zotero.org/support/dev/client_coding/plugin_development#setting_up_a_plugin_development_environment

---

In package.json, icon paths should be relative to `chrome` folder (folder need to be registered in chrome.manifest first in Zotero 6)

---

`zt-bundle --outdir dist main.ts` will create a xpi file in `dist` folder, with assets in `public` folder copied to dist folder.