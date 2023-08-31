import { useContext, useState } from "react";
import type { TplType } from "@/services/template/eta/preset";
import { SettingTabCtx } from "../common";
import { TextComfirmSettingBase } from "../components/TextComfirm";
import { templateDesc } from "./shared";

export function SimpleTemplateEdit({ type }: { type: TplType.Embeded }) {
  const { plugin } = useContext(SettingTabCtx);
  const { template } = plugin.settings;

  const [value, setValue] = useState<string>(template.templates[type]);
  const applySetting = async (val: string) => {
    const updated = await template.setTemplate(type, val);
    if (updated === false) return false;
    await plugin.settings.save();
  };

  return (
    <TextComfirmSettingBase
      name={templateDesc[type].title}
      value={value}
      onChange={(evt) => setValue(evt.target.value)}
      onSubmit={() => {
        setValue(value);
        applySetting(value);
      }}
    >
      {templateDesc[type].desc}
    </TextComfirmSettingBase>
  );
}
