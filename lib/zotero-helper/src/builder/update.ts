// https://extensionworkshop.com/documentation/manage/updating-your-extension/

import { getInfoFromPackageJson } from "./parse.js";

export function genUpdateJson(
  packageJson: Record<string, unknown>,
  hash: string,
) {
  const { id, version, update } = getInfoFromPackageJson(packageJson);
  return {
    addons: {
      [id]: [
        {
          version,
          update_link: update.download(version),
          update_hash: hash,
          update_info_url: update.info(version),
          applications: {
            /** Zotero 6 (based on Firefox 60.9.0 ESR) */ gecko: {
              strict_min_version: "60.9",
              strict_max_version: "60.9",
            },
            /** Zotero 7 */ zotero: {
              strict_min_version: "6.999",
              strict_max_version: "7.0.*",
            },
          },
        },
      ],
    },
  };
}
