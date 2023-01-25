// https://extensionworkshop.com/documentation/manage/updating-your-extension/

interface UpdateInfo {
  url: string;
  /** sha256 */
  hash: string;
  version: string;
  info_url: string;
}

function toUpdateDetails({ url, hash, version, info_url }: UpdateInfo) {
  return {
    version,
    update_link: url,
    update_hash: hash,
    update_info_url: info_url,
    applications: {
      // Zotero 6 (based on Firefox 60.9.0 ESR)
      gecko: {
        strict_min_version: "60.9",
        strict_max_version: "60.9",
      },
      // Zotero 7
      zotero: {
        strict_min_version: "6.999",
        strict_max_version: "7.0.*",
      },
    },
  };
}

export function genUpdateJson(id: string, update: UpdateInfo) {
  return {
    addons: {
      [id]: [toUpdateDetails(update)],
    },
  };
}
