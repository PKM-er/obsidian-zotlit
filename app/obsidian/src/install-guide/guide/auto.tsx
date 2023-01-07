import { useMemoizedFn } from "ahooks";
import clsx from "clsx";
import { atom, useAtomValue, useSetAtom } from "jotai";
import log from "../../logger";
import { useIconRef } from "../../utils/icon";
import { binaryFullPathAtom, binaryLinkAtom, modalAtom } from "./atom";
import { ListItem } from "./list-item";
import { Loading } from "./loading";
import { checkModuleStatus, downloadModule, importModule } from "./utils";

enum InstallState {
  Idle,
  Downloading,
  Importing,
  Success,
  Failed,
}
const installStateAtom = atom<InstallState>(InstallState.Idle);
const failedAtom = atom((get) => get(installStateAtom) === InstallState.Failed);

const errorMessageAtom = atom<string | null>(null);
const statusTextAtom = atom((get) => {
  switch (get(installStateAtom)) {
    case InstallState.Idle:
      return null;
    case InstallState.Downloading:
      return "Downloading...";
    case InstallState.Importing:
      return "Importing...";
    case InstallState.Success:
      return "Module successfully installed";
    case InstallState.Failed:
      return `Module install failed: ${get(errorMessageAtom)}`;
    default:
      break;
  }
});
const setErrorAtom = atom(
  null,
  (
    _get,
    set,
    [phrase, error]: [
      phrase:
        | InstallState.Idle
        | InstallState.Downloading
        | InstallState.Importing,
      error: unknown,
    ],
  ) => {
    set(installStateAtom, InstallState.Failed);
    const message = "Failed to install module when " + InstallState[phrase];
    log.error(message, error);
    set(
      errorMessageAtom,
      message + ": " + (error instanceof Error ? error.message : `${error}`),
    );
  },
);

const useInstallModule = () => {
  const setInstallState = useSetAtom(installStateAtom);
  const setError = useSetAtom(setErrorAtom);
  const downloadUrl = useAtomValue(binaryLinkAtom);
  const binaryPath = useAtomValue(binaryFullPathAtom);

  return useMemoizedFn(async () => {
    if (!binaryPath) {
      setError([InstallState.Idle, new Error(`Cannot find binary version`)]);
      return;
    }
    setInstallState(InstallState.Downloading);
    let binary;
    try {
      const status = await checkModuleStatus(downloadUrl);
      if (status === 404) {
        throw new Error(
          `Requested module not available (${downloadUrl}), please open an issue on GitHub`,
        );
      }
      binary = await downloadModule(downloadUrl);
    } catch (error) {
      setError([InstallState.Downloading, error]);
      return;
    }
    setInstallState(InstallState.Importing);
    try {
      await importModule(binary, binaryPath, false);
    } catch (error) {
      setError([InstallState.Importing, error]);
      return;
    }
    setInstallState(InstallState.Success);
  });
};

export const AutoInstall = () => {
  const installState = useAtomValue(installStateAtom);
  const statusText = useAtomValue(statusTextAtom);
  const modal = useAtomValue(modalAtom);
  const install = useInstallModule();
  return (
    <div className="zt-auto-install">
      <ListItem
        name="Auto Install"
        desc="Recommended"
        button={installState === InstallState.Idle ? "Install" : undefined}
        onClick={install}
      />
      {installState !== InstallState.Idle && (
        <ListItem
          className={clsx("zt-auto-install-status", {
            "mod-warning": installState === InstallState.Failed,
            "mod-success": installState === InstallState.Success,
          })}
          icon={<StatusIcon />}
          name={statusText}
          button={
            installState === InstallState.Success ? "Reload Plugin" : undefined
          }
          onClick={() => modal.reloadPlugin()}
        />
      )}
    </div>
  );
};

const DoneIcon = () => {
  const failed = useAtomValue(failedAtom);
  const [iconRef] = useIconRef<HTMLDivElement>(failed ? "slash" : "check");
  return (
    <div
      className="zt-install-done-icon"
      style={{ display: "contents" }}
      ref={iconRef}
    />
  );
};

const StatusIcon = () => {
  const installState = useAtomValue(installStateAtom);
  switch (installState) {
    case InstallState.Idle:
      return null;
    case InstallState.Downloading:
    case InstallState.Importing:
      return (
        <Loading
          className="zt-install-spin-icon"
          style={{ display: "contents" }}
        />
      );
    case InstallState.Success:
    case InstallState.Failed:
      return <DoneIcon />;
  }
};
