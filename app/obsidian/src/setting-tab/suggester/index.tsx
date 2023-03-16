import { useContext } from "react";
import { SettingTabCtx } from "../common";
import BooleanSetting from "../components/Boolean";

export default function Suggester() {
  const { suggester } = useContext(SettingTabCtx).plugin.settings;

  return (
    <>
      <BooleanSetting
        name="Citation Editor Suggester"
        settings={suggester}
        prop="citationEditorSuggester"
      />
      <BooleanSetting
        name="Show BibTex Citekey in Suggester"
        settings={suggester}
        prop="showCitekeyInSuggester"
      />
    </>
  );
}
