import { useContext } from "react";
import { TemplateNames } from "@/services/template/eta/preset";
import { SettingTabCtx, normalizePath } from "../common";
import BooleanSetting from "../components/Boolean";
import Setting from "../components/Setting";
import TextComfirmSetting from "../components/TextComfirm";
import AutoTrimSetting from "./AutoTrim";
import { EjectableTemplate, useEjectAll } from "./EjectableTemplate";
import { SimpleTemplateEdit } from "./SimpleTemplateEdit";

export default function Template() {
  const [ejected, ejectBtnRef] = useEjectAll();
  return (
    <>
      <TextComfirmSetting
        name="Template location"
        get={(s) => s.template.folder}
        set={(v, prev) => ({
          ...prev,
          template: { ...prev.template, folder: v },
        })}
        normalize={normalizePath}
      >
        The folder which templates are ejected into and stored
      </TextComfirmSetting>
      <BooleanSetting
        name="Auto pair for Eta"
        get={(s) => s.autoPairEta}
        set={(v, s) => ({ ...s, autoPairEta: v })}
      >
        {"Pair `<` and `%` automatically in eta templates."}
        <br />
        If you have issue with native auto pair features, you can disable this
        option and report the bug in GitHub
      </BooleanSetting>
      <AutoTrimSetting />
      <Setting heading name="Simple" />
      {TemplateNames.Embeded.map((type) => (
        <SimpleTemplateEdit key={type} type={type} />
      ))}
      <Setting
        heading
        name="Ejectable"
        ref={ejectBtnRef}
        description="These templates can be customized once saved to the template folder"
      >
        {ejected || <div>Eject</div>}
      </Setting>
      {TemplateNames.Ejectable.map((type) => (
        <EjectableTemplate key={type} type={type} />
      ))}
    </>
  );
}
