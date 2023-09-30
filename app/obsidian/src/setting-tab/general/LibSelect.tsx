import { useContext } from "react";
import { useIconRef } from "@/utils/icon";
import { SettingTabCtx, useRefreshAsync } from "../common";
import Setting, { useSetting } from "../components/Setting";

export default function CitationLibrarySelect() {
  const { database } = useContext(SettingTabCtx);

  const [value, setValue] = useSetting(
    (s) => s.citationLibrary,
    (v, prev) => ({ ...prev, citationLibrary: v }),
  );

  const [data, refresh] = useRefreshAsync(() => database.api.getLibs(), []);

  const libs = data.result ?? [
    { groupID: null, libraryID: 1, name: "My Library" },
  ];

  const [refreshIconRef] = useIconRef<HTMLButtonElement>("switch");
  return (
    <Setting name="Citation library">
      <select
        className="dropdown"
        onChange={(evt) => setValue(Number.parseInt(evt.target.value, 10))}
        value={value}
      >
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
          await database.refresh({ task: "full" });
          refresh();
        }}
      />
    </Setting>
  );
}
