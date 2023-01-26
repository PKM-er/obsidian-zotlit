import { isNonEmptyString, isZoterField } from "../utils.js";

export function getInfoFromPackageJson(packageJson: Record<string, unknown>) {
  const { name, version, description, homepage, zotero } = packageJson;

  if (
    !isNonEmptyString(name) ||
    !isNonEmptyString(version) ||
    !isNonEmptyString(description) ||
    !isNonEmptyString(homepage)
  ) {
    throw new Error(
      "Invaild name, version, description or homepage in package.json",
    );
  }
  if (!isZoterField(zotero)) {
    throw new Error("Invaild zotero field in package.json");
  }

  return {
    name,
    version,
    description,
    homepage,
    // deep copy
    zotero: { ...zotero },
  };
}
