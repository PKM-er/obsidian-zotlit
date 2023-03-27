import { useContext } from "react";
import {
  ejectableTemplateTypes,
  nonEjectableTemplateTypes,
} from "@/services/template/settings";
import { SettingTabCtx, normalizePath } from "../common";
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
        normalize={normalizePath}
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
      <Setting
        heading
        name="Update Note"
        description={
          <>
            You can find update note option in <code>More Options</code> menu
            and command pallette inside a literature note. When update, all
            literature notes with the same <code>zotero-key</code> will be
            updated.
          </>
        }
      />
      <BooleanSetting
        name="Overwrite Existing Note"
        settings={template}
        prop="updateOverwrite"
      >
        <div className="space-y-2">
          <div className="text-txt-error">
            ⚠ WARNING: This will overwrite the whole note content with latest
            one when update literature note, make sure you didn't add any custom
            content in the note before enable this option.
          </div>
        </div>
      </BooleanSetting>
      <BooleanSetting
        name="In-place Update of Existing Annotations"
        settings={template}
        prop="updateAnnotBlock"
      >
        <div className="space-y-2">
          <div>(Experimental)</div>
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
