import { forwardRef, useContext, useState } from "react";
import { SettingTabCtx } from "../common";
import Setting, { useApplySetting } from "../components/Setting";
import useExtraButton from "../components/useExtraButton";

export const EjectableTemplateHeading = forwardRef<
  HTMLDivElement,
  { ejected: boolean }
>(function EjectableTemplateHeading({ ejected }, ref) {
  return (
    <Setting
      heading
      name="Ejectable"
      description="These templates can be customized once saved to the template folder"
      ref={ref}
    >
      <div>{ejected ? "Revert" : "Eject"}</div>
    </Setting>
  );
});

export function useEjected() {
  const { template } = useContext(SettingTabCtx).plugin.settings;

  const [ejected, setEjected] = useState(template.ejected);
  const applyEjected = useApplySetting(template, "ejected");
  const ejectBtnRef = useExtraButton(
    async () => {
      setEjected(!ejected);
      await applyEjected(!ejected);
    },
    {
      icon: ejected ? "x-circle" : "folder-input",
      desc: ejected ? "Revert to default" : "Save template file to edit",
    },
  );
  return [ejected, ejectBtnRef] as const;
}
