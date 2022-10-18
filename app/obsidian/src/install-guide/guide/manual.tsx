import cls from "classnames";
import { useAtomValue } from "jotai";
import { Notice } from "obsidian";
import { useState } from "react";
import log from "../../logger";
import {
  binaryFullPathAtom,
  binaryLinkAtom,
  binaryNameAtom,
  modalAtom,
} from "./atom";
import { ListItem } from "./list-item";
import { importModule, uploadModule } from "./utils";

const install = async (binaryPath: string): Promise<boolean> => {
  try {
    const binary = await uploadModule();
    if (!binary) {
      log.info("No file selected, skip import module");
      return false;
    }
    await importModule(binary.arrayBuffer, binaryPath, binary.decompressed);
    return true;
  } catch (error) {
    new Notice(`Failed to import module: ${error}`);
    log.error("Failed to import module", error);
    return false;
  }
};

const ManualInstallGuide = () => {
  const [fileImported, setFileImported] = useState(false);

  const binaryPath = useAtomValue(binaryFullPathAtom);
  const onSelectFileClicked = async () => {
    if (!binaryPath) return;
    const success = await install(binaryPath);
    if (success) {
      setFileImported(true);
    }
  };

  const downloadLink = useAtomValue(binaryLinkAtom);
  const filename = useAtomValue(binaryNameAtom);
  const modal = useAtomValue(modalAtom);
  return (
    <ol>
      <li>
        Download <code>.node.gz</code> file from{" "}
        <a href={downloadLink}>GitHub</a>.
      </li>
      <li>
        Select downloaded <code>{filename}</code> or{" "}
        <code>{filename.replace(/\.gz$/, "")}</code> to install:
        <SelectButton onClick={onSelectFileClicked} done={fileImported} />
      </li>
      <li>
        Reload Obsidian Zotero Plugin:
        <ReloadButton
          onClick={() => modal.reloadPlugin()}
          // disabled={!fileImported}
        />
      </li>
    </ol>
  );
};

export const ManualInstall = () => {
  const [showGuide, setShowGuide] = useState(false);
  return (
    <div className="zt-manual-install">
      <ListItem
        name="Manual Install"
        desc="Use this option if you have trouble downloading the module with auto install."
        button={`${showGuide ? "Hide" : "Show"} Guide`}
        onClick={() => setShowGuide((prev) => !prev)}
      />
      <div hidden={!showGuide}>
        <ManualInstallGuide />
      </div>
    </div>
  );
};
const SelectButton = ({
  done,
  onClick,
}: {
  done: boolean;
  onClick: () => void;
}) => {
  return (
    <button className={cls({ "zt-import-done": done })} onClick={onClick}>
      {!done ? "Select" : "Library file imported"}
    </button>
  );
};
const ReloadButton = ({
  disabled,
  onClick,
}: {
  disabled?: boolean;
  onClick: () => void;
}) => {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      // style={{ backgroundColor: disabled ? colorDisabled : undefined }}
    >
      Reload Plugin
    </button>
  );
};
