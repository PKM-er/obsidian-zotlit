import assertNever from "assert-never";
import Settings from "@/settings/base";

interface NoteField {
  keyword: string;
  template: string;
}

interface SettingOptions {
  noteFieldsSuggester: boolean;
  noteFields: [string, NoteField][];
}

type SettingOptionsJSON = Omit<SettingOptions, "noteFields"> & {
  noteFields: Record<string, NoteField>;
};

export class NoteFieldsSettings extends Settings<SettingOptions> {
  get fieldNames() {
    return this.noteFields.map(([name]) => name);
  }
  getField(name: string) {
    return this.noteFields.find(([key]) => key === name)?.[1];
  }
  getDefaultField() {
    return {
      keyword: "",
      template: "",
    };
  }
  getTemplate(name: string) {
    return (
      this.getField(name)?.template || `> <%= it[${JSON.stringify(name)}] %>::`
    );
  }
  getDefaults() {
    return {
      noteFieldsSuggester: false,
      noteFields: Object.entries({
        highlights: this.getDefaultField(),
        questions: this.getDefaultField(),
      }),
    };
  }
  async apply(key: "noteFields"): Promise<void> {
    switch (key) {
      case "noteFields":
        return;
      default:
        assertNever(key);
    }
  }

  fromJSON(json: SettingOptionsJSON): void {
    const { noteFields, ...rest } = json;
    super.fromJSON({
      ...(noteFields ? { noteFields: Object.entries(noteFields) } : {}),
      ...rest,
    });
  }
  toJSON(): SettingOptionsJSON {
    return {
      noteFields: Object.fromEntries(this.noteFields),
      noteFieldsSuggester: this.noteFieldsSuggester,
    };
  }
}
