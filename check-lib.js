const supported = [
  ["darwin", "arm64"],
  ["darwin", "x64"],
  ["linux", "x64"],
  ["win32", "x64"],
  ["win32", "ia32"],
];

const os = require("os"),
  oArch = os.arch(),
  oPlatfrom = os.platform();
const { Modal, Notice } = require("obsidian"),
  { statSync } = require("fs"),
  { join } = require("path");

class GoToDownloadModal extends Modal {
  constructor() {
    super(app);
    this.linkToLib = `https://github.com/aidenlx/obsidian-zotero-plugin/blob/master/assets/node-sqlite3/napi-v3-${oPlatfrom}-${oArch}.tar.gz?raw=true`;
  }
  onOpen() {
    this.contentEl.createEl("h1", { text: "Install node-sqlite3" });
    this.contentEl.createDiv({}, (div) => {
      div.appendText(
        "Obsidian Zotero Plugin requires node-sqlite3 to be installed. " +
          "Follow the instructions below to install it.",
      );
      div.createEl("ol", {}, (ol) => {
        ol.createEl("li", {}, (li) => {
          li.appendText("Download zipped node-sqlite3 from ");
          li.createEl("a", { href: this.linkToLib, text: "GitHub" });
          li.appendText(".");
        });
        ol.createEl("li", {}, (li) => {
          li.appendText("Create a folder named ");
          li.createEl("code", { text: "node-sqlite3" });
          li.appendText(" under ");
          li.createEl(
            "a",
            { text: "Obsidian Config Folder (Click to open)" },
            (a) =>
              a.addEventListener("click", () =>
                app.openWithDefaultApp(app.vault.configDir),
              ),
          );
        });
        ol.createEl("li", {}, (li) => {
          li.appendText("Extract the zipped file into the ");
          li.createEl("code", { text: "node-sqlite3" });
          li.appendText(" folder.");
          li.createEl("br");
          li.appendText(" The folder structure should be something like this:");
          li.createEl("br");
          li.createEl("code", {
            text: ".obsidian/node-sqlite3/napi-v3-darwin-x64/node_sqlite3.node",
          });
        });
        ol.createEl("li", {}, (li) => {
          li.appendText("Re-enable Obsidian Zotero Plugin");
        });
      });
    });
  }
  onClose() {
    this.contentEl.empty();
  }
}

module.exports = (PATH_TO_CONFIG, LIB_ROOT) => {
  if (
    supported.some(
      ([platform, arch]) => oArch === arch && oPlatfrom === platform,
    )
  ) {
    const LIB_PATH = join(
      PATH_TO_CONFIG,
      LIB_ROOT,
      `napi-v3-${oArch}-${oPlatfrom}`,
      "node_sqlite3.node",
    );
    try {
      if (!statSync(LIB_PATH)?.isFile()) {
        new GoToDownloadModal().open();
      }
    } catch (error) {
      if (error.code === "ENOENT") {
        new GoToDownloadModal().open();
      } else {
        new Notice(error.toString());
      }
    }
  } else {
    new Notice(
      `Your device ${oArch}-${oPlatfrom} is not supported by obsidian-zotero-plugin`,
    );
  }
};
