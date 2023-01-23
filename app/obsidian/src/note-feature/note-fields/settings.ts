import assertNever from "assert-never";
import Settings from "../../settings/base";

interface NoteField {
  keyword: string;
  template: string;
}

interface SettingOptions {
  noteFieldsSuggester: boolean;
  noteFields: Map<string, NoteField>;
}

type SettingOptionsJSON = Omit<SettingOptions, "noteFields"> & {
  noteFields: Record<string, NoteField>;
};

export class NoteFieldsSettings extends Settings<SettingOptions> {
  getDefaults() {
    return {
      noteFieldsSuggester: false,
      noteFields: new Map(
        Object.entries({
          question: {
            keyword: "",
            template: `> <%= it.field %>::`,
          },
        } satisfies SettingOptionsJSON["noteFields"]),
      ),
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

  fromJSON(json: unknown): void {
    const { noteFields, ...rest } = json as SettingOptionsJSON;
    if (!noteFields) return;
    super.fromJSON({ noteFields: recordToMap(noteFields), ...rest });
  }
  toJSON(): SettingOptionsJSON {
    return {
      noteFields: mapToRecord(this.noteFields),
      noteFieldsSuggester: this.noteFieldsSuggester,
    };
  }
}

function recordToMap(
  record: Record<string, NoteField>,
): Map<string, NoteField> {
  return new Map(Object.entries(record));
}

function mapToRecord(map: Map<string, NoteField>): Record<string, NoteField> {
  return Object.fromEntries(map);
}
