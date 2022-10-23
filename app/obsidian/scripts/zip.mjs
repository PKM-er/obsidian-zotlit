import { createReadStream, createWriteStream } from "fs";
import JSZip from "jszip";
import { join } from "path";
import { pipeline } from "stream/promises";
const assets = ["main.js", "styles.css", "manifest.json"];
const zip = new JSZip();
for (const filename of assets) {
  zip.file(filename, createReadStream(join("build", filename)));
}
await pipeline(
  zip.generateNodeStream({ type: "nodebuffer", streamFiles: true }),
  createWriteStream(join("build", "obsidian-zotero-plugin.zip")),
);
console.log("obsidian-zotero-plugin.zip written.");
