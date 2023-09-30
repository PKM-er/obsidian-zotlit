import { useState } from "react";
import type { TplType } from "@/services/template/eta/preset";
import { useSetting } from "../components/Setting";
import { TextComfirmSettingBase } from "../components/TextComfirm";
import { templateDesc } from "./shared";

export function SimpleTemplateEdit({ type }: { type: TplType.Embeded }) {
  const [defaultValue, applyTemplate] = useSetting(
    (s) => s.template.templates[type],
    (v, prev) => ({
      ...prev,
      template: {
        ...prev.template,
        templates: { ...prev.template.templates, [type]: v },
      },
    }),
  );
  const [value, setValue] = useState<string>(defaultValue);

  return (
    <TextComfirmSettingBase
      name={templateDesc[type].title}
      value={value}
      onChange={(evt) => setValue(evt.target.value)}
      onSubmit={() => {
        applyTemplate(value);
      }}
    >
      {templateDesc[type].desc}
    </TextComfirmSettingBase>
  );
}
