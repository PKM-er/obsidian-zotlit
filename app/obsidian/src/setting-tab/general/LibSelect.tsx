import { useMemoizedFn } from "ahooks";
import { Notice } from "obsidian";
import { useContext, useState } from "react";
import { SettingTabCtx, useRefreshAsync } from "../common";
import Setting, { useApplySetting } from "../components/Setting";
import { useIconRef } from "@/utils/icon";

export default function CitationLibrarySelect() {
  const { plugin } = useContext(SettingTabCtx);
  const { database } = plugin.settings;

  const [data, refresh] = useRefreshAsync(
    () => plugin.databaseAPI.getLibs(),
    [],
  );
  const [value, setValue] = useState(() => database.citationLibrary);
  const applySeting = useApplySetting(database, "citationLibrary");

  const onChange = useMemoizedFn(async function onChange(
    evt: React.ChangeEvent<HTMLSelectElement>,
  ) {
    const val = Number.parseInt(evt.target.value, 10);
    if (Number.isNaN(val)) return;
    setValue(val);
    if (await applySeting(val)) {
      new Notice("Zotero search index updated.");
    }
  });

  const libs = data.result ?? [
    { groupID: null, libraryID: 1, name: "My Library" },
  ];

  const [refreshIconRef] = useIconRef<HTMLButtonElement>("switch");
  return (
    <Setting name="Citation Library">
      <select className="dropdown" onChange={onChange} value={value}>
        {libs.map(({ groupID, libraryID, name }) => (
          <option key={libraryID} value={libraryID}>
            {name
              ? groupID
                ? `${name} (Group)`
                : name
              : `Library ${libraryID}`}
          </option>
        ))}
      </select>
      <button
        aria-label="Refresh"
        ref={refreshIconRef}
        onClick={async () => {
          await plugin.dbWorker.refresh({ task: "full" });
          refresh();
        }}
      />
    </Setting>
  );
}
