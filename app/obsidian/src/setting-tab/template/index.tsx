import { useContext } from "react";
import {
  ejectableTemplateTypes,
  nonEjectableTemplateTypes,
} from "@/services/template/settings";
import { SettingTabCtx } from "../common";
import BooleanSetting from "../components/Boolean";
import Setting from "../components/Setting";
import TextComfirmSetting from "../components/TextComfirm";
import { EjectableTemplate } from "./EjectableTemplate";
import { FmFields } from "./FmFields";
import { SimpleTemplateEdit } from "./SimpleTemplateEdit";
import { EjectableTemplateHeading, useEjected } from "./useEjected";

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
      <BooleanSetting
        name="Update Existing Annotations (Experimental)"
        settings={template}
        prop="updateAnnotBlock"
      >
        <div className="space-y-2">
          <div>Update existing annotations</div>
          <div className="text-txt-error">
            ⚠ WARNING: When enable, the plugin will try to update existing
            annotaion callouts marked with block-id in addition to appped
            newly-added ones, which may cause unexpected behavior. Make sure you
            have backup of your notes before enable this option.
          </div>
          <div className="text-txt-accent">
            ⓘ Note: If you disable callout warpping in annotation template, you
            need to make sure the block-id is added properly in the template.
          </div>
          <div className="text-txt-accent">
            ⓘ Note: This won't work on annotations imported before this feature
            is available, unless every annotation is inside a block with proper
            block-id
          </div>
        </div>
      </BooleanSetting>
      <FmFields />
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
