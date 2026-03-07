<div style="margin-top: -40px;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;⏫ Remember to enable! <!-- Meant for Obsidian community plugin list view. --></div>

# Obsidian ZotLit

[![GitHub stars](https://custom-icon-badges.demolab.com/github/stars/PKM-er/obsidian-zotlit?logo=star)](https://github.com/PKM-er/obsidian-zotlit/stargazers "GitHub stars") [![GitHub issues](https://custom-icon-badges.demolab.com/github/issues-raw/PKM-er/obsidian-zotlit?logo=issue)](https://github.com/PKM-er/obsidian-zotlit/issues "GitHub issues") [![repo license](https://custom-icon-badges.demolab.com/github/license/PKM-er/obsidian-zotlit?logo=law&logoColor=white)](https://github.com/PKM-er/obsidian-zotlit/blob/main/LICENSE "repo license") [![current obsidian plugin version](https://custom-icon-badges.demolab.com/badge/dynamic/json?color=8b6cef&label=obsidian%20plugin&query=version&url=https%3A%2F%2Fraw.githubusercontent.com%2Faidenlx%2Fobsidian-zotero%2Fmaster%2Fapp%2Fobsidian%2Fmanifest.json&logo=obsidian-full)](https://obzt.aidenlx.top/getting-started/install/obsidian "open obsidian plugin page") [![current zotero plugin version](https://custom-icon-badges.demolab.com/badge/dynamic/json?color=bc3a3c&label=zotero%20plugin&query=version&url=https%3A%2F%2Fraw.githubusercontent.com%2Faidenlx%2Fobsidian-zotero%2Fmaster%2Fapp%2Fzotero%2Fpackage.json&logo=zotero-32)](https://obzt.aidenlx.top/getting-started/install/zotero "open zotero plugin page")

ZotLit is a third-party project that aims to facilitate the integration between [Obsidian.md](https://obsidian.md) and [Zotero](https://www.zotero.org), by providing a set of community plugins for both Obsidian and Zotero.

- [Full Documentation](https://obzt.aidenlx.top/)
- [中文文档](https://obzt.aidenlx.top/zh-CN/)

[![open in obsidian](https://custom-icon-badges.demolab.com/badge/-Open%20In%20Obsidian-d4d4d4?style=for-the-badge&logo=obsidian-full)](https://obsidian.md/plugins?id=zotlit "open in obsidian")

Disclaimer: The plugins in this project is manitained by third-party developer, who is not affiliated with Obsidian or Zotero. This means that they may be broken at any time due to Zotero and/or Obsidian updates. Although they are not intended to perform any write operations to your Zotero database, there are still risks of data-loss. Therefore, please make proper backup for your data before and when using this plugin, especially when you are using beta version.

If you have any questions or suggestions, please feel free to [open a discussion](https://github.com/PKM-er/obsidian-zotlit/discussions/new/choose) or [create an issue](https://github.com/PKM-er/obsidian-zotlit/issues/new).

## Compatibility

The required API feature for latest obsidian plugin is only available for:
[![minimal obsidian version](https://custom-icon-badges.demolab.com/badge/dynamic/json?color=8b6cef&label=obsidian&prefix=^&query=minAppVersion&url=https%3A%2F%2Fraw.githubusercontent.com%2Faidenlx%2Fobsidian-zotero%2Fmaster%2Fapp%2Fobsidian%2Fmanifest.json&logo=obsidian-full)](https://obsidian.md "minimal obsidian version")

The latest zotero plugin currently supports:
[![Zotero 7](https://custom-icon-badges.demolab.com/badge/zotero-7-bc3a3c?logo=zotero-32) ![Zotero 8](https://custom-icon-badges.demolab.com/badge/zotero-8-bc3a3c?logo=zotero-32)](https://www.zotero.org/download/ "supported zotero version")

## Zotero 8 Upgrade Guide

Zotero 8 (released January 2026) is now supported. If you are upgrading from Zotero 7, follow these steps:

### For Users

1. **Update the Zotero plugin**: Download the latest `.xpi` release from the [releases page](https://github.com/PKM-er/obsidian-zotlit/releases) and install it in Zotero via `Tools > Add-ons > Install Add-on From File`.
2. **Update the Obsidian plugin**: Update ZotLit to the latest version from Obsidian's community plugin settings.
3. **Verify connectivity**: After installing both plugins, open a PDF in the Zotero reader and confirm that:
   - The Obsidian Actions submenu appears when right-clicking items in the library
   - Literature notes can be opened/created from Zotero
4. **No database migration needed**: The Zotero 8 SQLite database schema is unchanged, so your existing templates, citations, and notes will continue to work.

### Known Limitations in Zotero 8

Some features rely on internal Zotero Reader APIs that may have changed in Zotero 8. If any of these features do not work, they will degrade gracefully (log a warning instead of crashing):

| Feature | Status |
|---------|--------|
| Library item context menus (Open/Update/Create Note) | Fully supported |
| Obsidian protocol integration (`obsidian://zotero/`) | Fully supported |
| Real-time item update notifications | Fully supported |
| SQLite database reads (templates, citations) | Fully supported |
| Better BibTeX citekey lookups | Fully supported |
| Reader annotation selection tracking | May be limited |
| Reader focus/blur tracking | May be limited |
| Reader context menus (Export/Merge annotations) | May be limited |
| Merge annotations feature | May be limited |

If you encounter issues, please [open an issue](https://github.com/PKM-er/obsidian-zotlit/issues/new) with your Zotero version and error details from `Help > Debug Output Logging > View Output`.

### For Developers

Key changes in the Zotero 8 compatibility update:

- `strict_max_version` updated from `"7.0.*"` to `"8.0.*"`
- Bootstrap `Services` import uses `ChromeUtils.importESModule("resource://gre/modules/Services.sys.mjs")` with JSM fallback for Zotero 7
- `isZotero8()` helper available via `@aidenlx/zotero-helper/zotero`
- All private Reader API monkey-patching is now wrapped in defensive try/catch
- Zotero 6 dead code paths have been removed from the bootstrap
