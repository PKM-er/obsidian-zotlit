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
  constructor(LIB_FILENAME) {
    super(app);
    this.LIB_FILENAME = LIB_FILENAME;
    this.linkToLib = `https://github.com/aidenlx/obsidian-zotero-plugin/blob/master/assets/better-sqlite3/${oPlatfrom}-${oArch}.zip?raw=true`;
  }
  onOpen() {
    this.contentEl.createEl("h1", { text: "Install better-sqlite3" });
    this.contentEl.createDiv({}, (div) => {
      div.appendText(
        "Obsidian Zotero Plugin requires node-sqlite3 to be installed. " +
          "Follow the instructions below to install it.",
      );
      div.createEl("ol", {}, (ol) => {
        ol.createEl("li", {}, (li) => {
          li.appendText("Download zip file from ");
          li.createEl("a", { href: this.linkToLib, text: "GitHub" });
          li.appendText(".");
        });
        ol.createEl("li", {}, (li) => {
          li.appendText("Extract the ");
          li.createEl("code", { text: this.LIB_FILENAME });
          li.appendText(" file and place it under ");
          li.createEl(
            "a",
            { text: "Obsidian Config Folder (Click to open)" },
            (a) =>
              a.addEventListener("click", () =>
                app.openWithDefaultApp(app.vault.configDir),
              ),
          );
          li.createEl("br");
          li.appendText(" The folder structure should be something like this:");
          li.createEl("br");
          li.createEl("code", {
            text: ".obsidian/better_sqlite3.node",
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

module.exports = (PATH_TO_CONFIG, LIB_FILENAME) => {
  if (
    supported.some(
      ([platform, arch]) => oArch === arch && oPlatfrom === platform,
    )
  ) {
    const LIB_FILE = join(PATH_TO_CONFIG, LIB_FILENAME);
    try {
      if (!statSync(LIB_FILE)?.isFile()) {
        new GoToDownloadModal(LIB_FILENAME).open();
      }
    } catch (error) {
      if (error.code === "ENOENT") {
        new GoToDownloadModal(LIB_FILENAME).open();
      } else {
        new Notice(error.toString());
      }
    }
  } else {
    new Notice(
      `Your device (${oArch}-${oPlatfrom}) is not supported by obsidian-zotero-plugin`,
    );
  }
};
