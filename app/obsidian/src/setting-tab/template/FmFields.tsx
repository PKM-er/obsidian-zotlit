import { deleteKey, update } from "@mobily/ts-belt/Dict";
import { useMemoizedFn } from "ahooks";
import { debounce } from "obsidian";
import { useContext, useMemo, useState } from "react";
import * as React from "react";
import { SettingTabCtx } from "../common";
import Setting, { useApplySetting } from "../components/Setting";
import TextComfirmSetting from "../components/TextComfirm";
import useExtraButton from "../components/useExtraButton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { FmFieldsMapping, FmMode } from "@/services/template/frontmatter";
import { fmModes } from "@/services/template/frontmatter";
import { useIconRef } from "@/utils/icon";
function FmFieldModeSelect() {
  const { plugin } = useContext(SettingTabCtx);
  const { template } = plugin.settings;
  const [mode, setMode] = useState(() => template.fmFieldsMode);
  const applySeting = useApplySetting(template, "fmFieldsMode");
  const onModeChange = useMemoizedFn(async function onChange(
    evt: React.ChangeEvent<HTMLSelectElement>,
  ) {
    const val = evt.target.value as FmMode;
    setMode(val);
    await applySeting(val);
  });
  return (
    <Setting
      name="Mode"
      description={
        <>
          Use whitelist to include only the fields specified in{" "}
          <code>Mapping</code>
          <br />
          Use blacklist to include all fields available except the fields
          specified in <code>Mapping</code>
        </>
      }
    >
      <select className="dropdown" onChange={onModeChange} value={mode}>
        {fmModes.map((mode) => (
          <option key={mode} value={mode}>
            {mode}
          </option>
        ))}
      </select>
    </Setting>
  );
}

export function FmFields() {
  const { plugin } = useContext(SettingTabCtx);
  const { template } = plugin.settings;
  const [mapping, setMapping] = useState(() => template.fmFieldsMapping);
  const applySeting = useApplySetting(template, "fmFieldsMapping");
  const applyMapping = useMemo(
    () => debounce((mapping: FmFieldsMapping) => applySeting(mapping), 500),
    [applySeting],
  );

  const [newField, setNewField] = useState("");
  const addMappingRef = useExtraButton(
    () => {
      if (!newField) return;
      const next = { ...mapping, [newField]: true };
      setMapping(next);
      applyMapping(next);
      setNewField("");
    },
    { icon: "plus", desc: "Add" },
  );

  const [isOpen, setIsOpen] = React.useState(true);
  const [collapsibleRef] = useIconRef<HTMLButtonElement>(
    isOpen ? "chevrons-down-up" : "chevrons-up-down",
  );
  return (
    <>
      <Setting
        heading
        name="Metadata Fields"
        description="Specify metadata fields that will be added to the frontmatter of the note."
      />
      <FmFieldModeSelect />
      <TextComfirmSetting
        name="Tag Prefix"
        settings={template}
        prop="fmTagPrefix"
      >
        If you want all the tags imported from zotero to be included in a
        certain category, you can specify it here. For example: <code>zt/</code>
      </TextComfirmSetting>
      <Setting
        name="Mapping"
        description={
          <>
            Specify the fields to import to the frontmatter of the note.
            <br />
            You can also specify the alias of the field here if you don't like
            the default field name from Zotero.
          </>
        }
        ref={addMappingRef}
      >
        <input
          type="text"
          value={newField}
          onChange={(evt) => setNewField(evt.target.value)}
          placeholder="Name of new field"
        />
      </Setting>
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className="flex flex-col items-end"
      >
        <CollapsibleTrigger asChild>
          <button
            ref={collapsibleRef}
            aria-label={isOpen ? "Hide Fields" : "Show All Fields"}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="p-3 divide-y">
          {Object.entries(mapping).map(([field, alias]) => (
            <Setting key={field} name={<code>{field}</code>}>
              <Field
                alias={alias}
                onAliasChange={(alias) => {
                  const next = update(
                    mapping,
                    field as keyof FmFieldsMapping,
                    () => alias,
                  );
                  setMapping(next);
                  applyMapping(next);
                }}
                onDelete={() => {
                  const next = deleteKey(
                    mapping,
                    field as keyof FmFieldsMapping,
                  );
                  setMapping(next);
                  applyMapping(next);
                }}
              />
            </Setting>
          ))}
        </CollapsibleContent>
      </Collapsible>
    </>
  );
}

function Field({
  alias,
  onAliasChange,
  onDelete,
}: {
  alias: string | true;
  onAliasChange: (alias: string | true) => void;
  onDelete: () => void;
}) {
  const [deleteIconRef] = useIconRef<HTMLButtonElement>("trash");
  return (
    <>
      <input
        type="text"
        placeholder="Specify Alias Here"
        value={alias === true ? "" : alias}
        onChange={(evt) =>
          onAliasChange(evt.target.value ? evt.target.value : true)
        }
      />
      <button aria-label="Remove" ref={deleteIconRef} onClick={onDelete} />
    </>
  );
}
