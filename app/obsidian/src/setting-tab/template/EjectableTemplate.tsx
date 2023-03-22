import { useContext } from "react";
import { openTemplatePreview } from "@/note-feature/template-preview/open";
import type { EjectableTemplate } from "@/services/template/settings";
import { useIconRef } from "@/utils/icon";
import { SettingTabCtx } from "../common";
import Setting from "../components/Setting";
import { templateDesc } from "./shared";

export function EjectableTemplate({
  ejected,
  type,
}: {
  ejected: boolean;
  type: EjectableTemplate;
}) {
  const { plugin } = useContext(SettingTabCtx);
  const loader = plugin.templateLoader;
  const [openIconRef] = useIconRef<HTMLButtonElement>("arrow-up-right");
  if (ejected) {
    const filePath = loader.getTemplateFile(type);
    return (
      <Setting
        name={templateDesc[type].title}
        description={templateDesc[type].desc}
      >
        <code>{filePath}</code>
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
          {loader.getTemplate(type)}
        </pre>
      </Setting>
    );
  }
}
