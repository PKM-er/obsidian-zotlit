import { isNonEmptyString, isZoterField } from "../utils.js";

export interface PackageInfo {
  name: string;
  author: string;
  id: string;
  version: string;
  description: string;
  homepage: string;
  icons: Record<string, string>;
  update: {
    /** update.json */
    versions: string;
    /** url to each update's release */
    download: (version: string) => string;
    /** url to each update's log */
    info: (version: string) => string;
  };
}

export function getInfoFromPackageJson(packageJson: Record<string, unknown>) {
  const { author, version, description, homepage, zotero } = packageJson;

  if (
    !isNonEmptyString(version) ||
    !isNonEmptyString(description) ||
    !isNonEmptyString(homepage) ||
    !isNonEmptyString(author)
  ) {
    throw new Error(
      "Invaild author, version, description or homepage in package.json",
    );
  }
  if (!isZoterField(zotero)) {
    throw new Error("Invaild zotero field in package.json");
  }

  const { icons, id, name, update } = zotero;

  return {
    name,
    id,
    version,
    description,
    homepage,
    icons,
    author,
    update: {
      ...update,
      download: (version: string) =>
        update.download.replaceAll("{version}", version),
      info: (version: string) => update.info.replaceAll("{version}", version),
    },
  } satisfies PackageInfo;
}
