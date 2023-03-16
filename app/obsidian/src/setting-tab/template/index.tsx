import { useContext } from "react";
import { SettingTabCtx } from "../common";
import BooleanSetting from "../components/Boolean";
import Setting from "../components/Setting";
import TextComfirmSetting from "../components/TextComfirm";
import { EjectableTemplate } from "./EjectableTemplate";
import { SimpleTemplateEdit } from "./SimpleTemplateEdit";
import { EjectableTemplateHeading, useEjected } from "./useEjected";
import {
  ejectableTemplateTypes,
  nonEjectableTemplateTypes,
} from "@/services/template/settings";

export default function Template() {
  const { template } = useContext(SettingTabCtx).plugin.settings;
  const [ejected, ejectBtnRef] = useEjected();
  return (
    <>
      <TextComfirmSetting
        name="Template Folder"
        settings={template}
        prop="folder"
      >
        The folder which templates are ejected into and stored
      </TextComfirmSetting>
      <BooleanSetting
        name="Auto Pair For Eta"
        settings={template}
        prop="autoPairEta"
      >
        {"Pair `<` and `%` automatically in eta templates."}
        <br />
        If you have issue with native auto pair features, you can disable this
        option and report the bug in GitHub
      </BooleanSetting>
      <Setting heading name="Simple" />
      {nonEjectableTemplateTypes.map((type) => (
        <SimpleTemplateEdit key={type} type={type} />
      ))}
      <EjectableTemplateHeading ejected={ejected} ref={ejectBtnRef} />
      {ejectableTemplateTypes.map((type) => (
        <EjectableTemplate key={type} ejected={ejected} type={type} />
      ))}
    </>
  );
}
