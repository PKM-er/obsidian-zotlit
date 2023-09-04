import assertNever from "assert-never";
import { useAtomValue } from "jotai";
import { guideModeAtom } from "./atom";
import { AutoInstall } from "./auto";
import { ManualInstall } from "./manual";

const InstallGuideDesc = () => {
  const mode = useAtomValue(guideModeAtom);
  switch (mode) {
    case "install":
      return (
        <>
          ZotLit requires latest version of <code>better-sqlite3</code> to be
          installed. Use one of the method below to install or update it.
        </>
      );
    case "reset":
      return (
        <>
          <code>better-sqlite3</code> seems to be broken and failed to load. you
          can try to use one of the method below to reinstall it.
        </>
      );
    default:
      assertNever(mode);
  }
};

export const InstallGuide = () => {
  return (
    <>
      <style>{`
.modal.mod-zt-install-guide .modal-content {
  display: flex;
  flex-direction: column;
}
.zt-install-methods {
  display: flex;
  flex-direction: column;
  gap: var(--size-4-4);
  flex-grow: 1;
  padding: var(--size-4-4);
  padding-bottom: var(--size-4-2);
}
.zt-install-methods .setting-item {
  padding: 0;
}
.zt-auto-install {
  display: flex;
  flex-direction: column;
  gap: var(--size-4-4);
}
.modal.mod-zt-install-guide button:disabled {
  background-color: var(--background-modifier-cover);
}
.modal.mod-zt-install-guide button:disabled:hover {
  box-shadow: var(--input-shadow);
}
.modal.mod-zt-install-guide button.zt-import-done {
  background-color: var(--background-modifier-success);
}
.zt-auto-install-status {
  border-top: none;
}
.zt-auto-install-status.mod-success .setting-icon ,
.zt-auto-install-status.mod-success .setting-item-name  {
  color: var(--text-success);
}
.zt-auto-install-status.mod-warning .setting-icon ,
.zt-auto-install-status.mod-warning .setting-item-name  {
  color: var(--text-error);
}
.zt-auto-install-status .setting-icon ,
.zt-auto-install-status .setting-item-name  {
  color: var(--text-muted);
}
      `}</style>
      <div className="zt-install-desc">
        <InstallGuideDesc />
      </div>
      <div className="zt-install-methods">
        <AutoInstall />
        <ManualInstall />
      </div>
    </>
  );
};
