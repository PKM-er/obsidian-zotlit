import { Notice, TFile, TFolder } from "obsidian";
import { useContext, useEffect, useState } from "react";
import { openTemplatePreview } from "@/note-feature/template-preview/open";

import { Template, toPath, type TplType } from "@/services/template/eta/preset";
import { useIconRef } from "@/utils/icon";
import { SettingTabCtx } from "../common";
import Setting from "../components/Setting";
import { templateDesc } from "./shared";

export function EjectableTemplate({ type }: { type: TplType.Ejectable }) {
  const { plugin } = useContext(SettingTabCtx);
  const settings = plugin.settings.template;
  const [openIconRef] = useIconRef<HTMLButtonElement>("arrow-up-right");

  const filepath = toPath(type, settings.folder);
  const [ejected, setEjected] = useState(
    () => plugin.app.vault.getAbstractFileByPath(filepath) instanceof TFile,
  );
  useEffect(() => {
    const ref = plugin.app.vault.on("delete", (f) => {
      f.path === filepath && setEjected(false);
    });
    return () => plugin.app.vault.offref(ref);
  }, [filepath]);

  if (ejected) {
    return (
      <Setting
        name={templateDesc[type].title}
        description={templateDesc[type].desc}
      >
        <code>{filepath}</code>
        <button
          aria-label="Open Template File"
          ref={openIconRef}
          onClick={async () => {
            await openTemplatePreview(type, null, plugin);
          }}
        />
      </Setting>
    );
  } else {
    return (
      <Setting
        name={templateDesc[type].title}
        description={templateDesc[type].desc}
      >
        <pre className="text-left max-w-xs overflow-scroll rounded border p-4">
          {Template.Ejectable[type]}
        </pre>
        <button
          aria-label="Save to Template Folder"
          ref={openIconRef}
          onClick={async () => {
            const file = plugin.app.vault.getAbstractFileByPath(filepath);
            if (file instanceof TFile) {
              setEjected(true);
              return;
            }
            if (file) {
              new Notice(`The path '${filepath}' is occupied by a folder`);
              return;
            }
            await plugin.app.fileManager.createNewMarkdownFile(
              plugin.app.vault.getRoot(),
              filepath,
              Template.Ejectable[type],
            );
            new Notice(`Template '${filepath}' created`);
            setEjected(true);
          }}
        />
      </Setting>
    );
  }
}
