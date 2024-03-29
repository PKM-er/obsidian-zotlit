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
import { useIconRef } from "@/utils/icon";
import { SettingTabCtx } from "../common";
import Setting from "../components/Setting";
import useExtraButton from "../components/useExtraButton";
import { templateDesc } from "./shared";

export function EjectableTemplate({ type }: { type: TplType.Ejectable }) {
  const { app, settings } = useContext(SettingTabCtx);
  const [openIconRef] = useIconRef<HTMLButtonElement>("arrow-up-right");
  const [ejectIconRef] = useIconRef<HTMLButtonElement>("folder-input");
  const [resetIconRef] = useIconRef<HTMLButtonElement>("reset");

  const [ejected, setEjected] = useState(() =>
    isEjected(type, { app, folder: settings.templateDir }),
  );
  const filepath = toPath(type, settings.templateDir);
  useEffect(() => {
    const refs = [
      app.vault.on("delete", (f) => {
        f.path === filepath && setEjected(false);
      }),
      app.vault.on("create", (f) => {
        f.path === filepath && setEjected(true);
      }),
      app.vault.on("rename", (f, old) => {
        f.path === filepath && setEjected(true);
        old === filepath && setEjected(false);
      }),
    ];
    return () => refs.forEach((ref) => app.vault.offref(ref));
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
            await openTemplatePreview(type, null, { app, settings });
          }}
        />
        <button
          aria-label="Reset to default"
          ref={resetIconRef}
          onClick={async () => {
            // make sure prompt is shown in the active window
            if (!activeWindow.confirm("Reset template to default?")) return;
            const file = app.vault.getAbstractFileByPath(filepath);
            if (file instanceof TFile) {
              await app.vault.modify(file, Template.Ejectable[type]);
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
              app: app,
              folder: settings.templateDir,
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
  const { app, settings } = useContext(SettingTabCtx);

  const [ejected, setEjected] = useState(() =>
    TemplateNames.Ejectable.every((type) =>
      isEjected(type, { app, folder: settings.templateDir }),
    ),
  );
  const ejectBtnRef = useExtraButton(
    async () => {
      const toEject = TemplateNames.Ejectable.filter(
        (type) => !isEjected(type, { app, folder: settings.templateDir }),
      );
      await Promise.all(
        toEject.map((type) =>
          eject(type, { app, folder: settings.templateDir }),
        ),
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
