import { D } from "@mobily/ts-belt";

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

function isNonEmptyString(x: unknown): x is string {
  return typeof x === "string" && x !== "";
}
interface ZoteroField {
  update_url: string;
  id: string;
  icons: Record<string, string>;
}
function isZoterField(x: unknown): x is ZoteroField {
  return (
    typeof x === "object" &&
    x !== null &&
    typeof (x as ZoteroField).update_url === "string" &&
    typeof (x as ZoteroField).id === "string" &&
    typeof (x as ZoteroField).icons === "object" &&
    (x as ZoteroField).icons !== null &&
    D.isNotEmpty((x as ZoteroField).icons)
  );
}
