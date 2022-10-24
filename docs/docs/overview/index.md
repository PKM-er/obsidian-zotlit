---
sidebar_position: 1
---

# Overview

This is a third-party project that aims to facilitate the integration between [Obsidian.md](https://obsidian.md) and [Zotero](https://www.zotero.org), by providing a set of community plugins for both Obsidian and Zotero.

## Getting Started

1. [Installation](../getting-started/install/)
2. [Basic Usage](../getting-started/basic-usage/)
3. [Advanced Feature](../getting-started/advanced-feature/)

## Features

:::note
This plugin is still under active development, and the features are subject to change and may not be fully implemented.
:::

- ⚡️ Performance
    - Read data directly from Zotero database, no need to export data in text-based format
    - Fast fuzzy-search for literatures right within Obsidian
- 🔓 Full access to Zotero data
    - All data are available in Obsidian, including annotations, notes, tags, and attachments.
    - Not restricted by Zotero API or Better BibTex.
- 🔨 Highly customizable templates
    - Write your own templates to generate literature note and import annotation in any format you want.
    - Powered by [Eta](https://eta.js.org/), write JavaScript code in your templates to handle complex transformations.
    - View all data in a literature in a structured way by using `DetailsView`.
- 🔍 Annotation View
    - View annotaions within Obsidian, side-by-side with the literature note.
    - Drag annotation to the literature note to import it.
    - Always up-to-date, auto-sync whenever you changes the annotation in Zotero.
- 📝 Annotation import
    - Import image and text annotation from Zotero to Obsidian.
    - Keep your annotation up-to-date with Zotero.
- ✍️ Create literature notes with ease
    - Quick switcher to create literature note and insert citekey from any literatures in your Zotero library.
    - Open literature note in Obsidian from Zotero item page.

## Disclaimer

The plugins in this project is manitained by third-party developer, who is not affiliated with Obsidian or Zotero. This means that they may be broken at any time due to Zotero and/or Obsidian updates. Although they are not intended to perform any write operations to your Zotero database, there are still risks of data-loss. Therefore, please make proper backup for your data before and when using this plugin, especially when you are using beta version.

## Credit

Inspired by [obsidian-citation](https://github.com/hans/obsidian-citation-plugin), [BibNotes Formatter](https://github.com/stefanopagliari/bibnotes) and [obsidian-zotero-integration](https://github.com/mgmeyers/obsidian-zotero-integration)
