import type { App } from "obsidian";
import { Notice, TFile } from "obsidian";
import { useContext, useEffect, useState } from "react";
import { openTemplatePreview } from "@/note-feature/template-preview/open";

import {
  Template,
  TemplateNames,
  toPath,
  type TplType,
} from "@/services/template/eta/preset";
import { getActiveWin } from "@/utils/active-win";
import { useIconRef } from "@/utils/icon";
import { SettingTabCtx } from "../common";
import Setting from "../components/Setting";
import useExtraButton from "../components/useExtraButton";
import { templateDesc } from "./shared";

export function EjectableTemplate({ type }: { type: TplType.Ejectable }) {
  const { plugin } = useContext(SettingTabCtx);
  const settings = plugin.settings.template;
  const [openIconRef] = useIconRef<HTMLButtonElement>("arrow-up-right");
  const [ejectIconRef] = useIconRef<HTMLButtonElement>("folder-input");
  const [resetIconRef] = useIconRef<HTMLButtonElement>("reset");

  const [ejected, setEjected] = useState(() =>
    isEjected(type, { app: plugin.app, folder: settings.folder }),
  );
  const filepath = toPath(type, settings.folder);
  useEffect(() => {
    const refs = [
      plugin.app.vault.on("delete", (f) => {
        f.path === filepath && setEjected(false);
      }),
      plugin.app.vault.on("create", (f) => {
        f.path === filepath && setEjected(true);
      }),
      plugin.app.vault.on("rename", (f, old) => {
        f.path === filepath && setEjected(true);
        old === filepath && setEjected(false);
      }),
    ];
    return () => refs.forEach((ref) => plugin.app.vault.offref(ref));
  }, [filepath]);

  if (ejected) {
    return (
      <Setting
        name={templateDesc[type].title}
        description={templateDesc[type].desc}
      >
        <code>{filepath}</code>
        <button
          aria-label="Open template file"
          ref={openIconRef}
          onClick={async () => {
            await openTemplatePreview(type, null, plugin);
          }}
        />
        <button
          aria-label="Reset to default"
          ref={resetIconRef}
          onClick={async () => {
            // make sure prompt is shown in the active window
            const win = getActiveWin(plugin.app);
            if (!win.confirm("Reset template to default?")) return;
            const file = plugin.app.vault.getAbstractFileByPath(filepath);
            if (file instanceof TFile) {
              await plugin.app.vault.modify(file, Template.Ejectable[type]);
              new Notice(`Template '${filepath}' reset`);
            } else {
              setEjected(true);
            }
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
          aria-label="Save to template folder"
          ref={ejectIconRef}
          onClick={async () => {
            const ejected = await eject(type, {
              app: plugin.app,
              folder: settings.folder,
            });
            setEjected(ejected);
          }}
        />
      </Setting>
    );
  }
}

async function eject(
  type: TplType.Ejectable,
  { app, folder }: { app: App; folder: string },
) {
  const filepath = toPath(type, folder);
  const file = app.vault.getAbstractFileByPath(filepath);
  if (file instanceof TFile) {
    return true;
  }
  if (file) {
    new Notice(`The path '${filepath}' is occupied by a folder`);
    return false;
  }
  await app.fileManager.createNewMarkdownFile(
    app.vault.getRoot(),
    filepath,
    Template.Ejectable[type],
  );
  new Notice(`Template '${filepath}' created`);
  return true;
}
function isEjected(
  type: TplType.Ejectable,
  { app, folder }: { app: App; folder: string },
) {
  const filepath = toPath(type, folder);
  const file = app.vault.getAbstractFileByPath(filepath);
  return file instanceof TFile;
}

export function useEjectAll() {
  const {
    app,
    settings: { template: settings },
  } = useContext(SettingTabCtx).plugin;

  const [ejected, setEjected] = useState(() =>
    TemplateNames.Ejectable.every((type) =>
      isEjected(type, { app, folder: settings.folder }),
    ),
  );
  const ejectBtnRef = useExtraButton(
    async () => {
      const toEject = TemplateNames.Ejectable.filter(
        (type) => !isEjected(type, { app, folder: settings.folder }),
      );
      await Promise.all(
        toEject.map((type) => eject(type, { app, folder: settings.folder })),
      );
      setEjected(true);
    },
    {
      icon: ejected ? "" : "folder-input",
      desc: ejected ? "" : "Save template files to template folder",
      disable: ejected,
    },
  );
  return [ejected, ejectBtnRef] as const;
}
