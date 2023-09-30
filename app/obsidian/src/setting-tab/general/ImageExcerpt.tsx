import { normalizePath } from "../common";
import SettingsComponent, { useSetting } from "../components/Setting";
import TextComfirmSetting from "../components/TextComfirm";

type ImportModeSelect = "false" | "copy" | "symlink";
export function ImageExcerptSetting() {
  const [importMode, setImportMode] = useSetting(
    (s) => (s.imgExcerptImport === false ? "false" : s.imgExcerptImport),
    (v, prev) => {
      const mode = v === "false" ? false : v;
      return { ...prev, imgExcerptImport: mode };
    },
  );

  return (
    <>
      <SettingsComponent
        heading
        name="Image excerpt"
        description="Controls how to import images in annotaion excerpts."
      />
      <SettingsComponent
        name="Mode"
        description={
          <dl className="mt-2 grid grid-cols-3 gap-1">
            <div>
              <dt className="text-xs font-medium text-txt-normal">
                Direct link
              </dt>
              <dd className="mt-1">
                Use image embed linked directly to the original image in Zotero
                cache using <code>file://</code> url
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-txt-normal">Symlink</dt>
              <dd className="mt-1">
                Create a symlink to the original image in Zotero cache within
                the specified folder
                <p className="text-txt-error">
                  Don't use this option if your file system doesn't support
                  symlink.
                </p>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-txt-normal">Copy</dt>
              <dd className="mt-1">
                Copy the original image to the specified folder.
              </dd>
            </div>
          </dl>
        }
      >
        <select
          className="dropdown"
          onChange={(evt) =>
            setImportMode(evt.target.value as ImportModeSelect)
          }
          value={importMode}
        >
          <option value={"false" satisfies ImportModeSelect} key={0}>
            direct link
          </option>
          <option value={"symlink" satisfies ImportModeSelect} key={1}>
            symlink
          </option>
          <option value={"copy" satisfies ImportModeSelect} key={2}>
            copy
          </option>
        </select>
      </SettingsComponent>
      {importMode !== "false" && (
        <>
          <TextComfirmSetting
            name="Default location"
            get={(s) => s.imgExcerptPath}
            set={(v, prev) => ({ ...prev, imgExcerptPath: v })}
            normalize={normalizePath}
          >
            The folder to store image excerpts.
          </TextComfirmSetting>
        </>
      )}
    </>
  );
}
