import BooleanSetting from "../components/Boolean";

export default function Suggester() {
  return (
    <>
      <BooleanSetting
        name="Citation editor suggester"
        get={(s) => s.citationEditorSuggester}
        set={(v, s) => ({ ...s, citationEditorSuggester: v })}
      />
      <BooleanSetting
        name="Show BibTex citekey in suggester"
        get={(s) => s.showCitekeyInSuggester}
        set={(v, s) => ({ ...s, showCitekeyInSuggester: v })}
      />
    </>
  );
}
