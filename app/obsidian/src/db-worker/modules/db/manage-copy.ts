import { constants as fsConst, promises as fs } from "fs";
import path from "path";

import { DBInfo } from "./misc";

const OB_ZT_COPY_EXT = ".obzttemp";
const getCopyPath = (dbPath: string, version: number) =>
  `${dbPath}.${version}${OB_ZT_COPY_EXT}`;
/**
 * keep databse copy up to date with main database
 * create new copy and remove out-of-date copies
 * @returns info about the latest database copy; null if temp database not updated
 */
export const updateDbCopy = async (
  info: DBInfo,
): Promise<[path: string, version: number] | null> => {
  const { path: dbPath, version } = info;
  const [newCopy, newVersion] = await getLatestDbCopyPath(info.path);

  // already up-to-date
  if (newVersion === version) return null;
  else {
    await createDbCopy(dbPath, newCopy);
    cleanupOldCopies(dbPath, newCopy);
    return [newCopy, newVersion];
  }
};
/**
 * @param overwrite whether to overwrite existing file
 * @returns true if file written
 */
export const createDbCopy = async (
  srcPath: string,
  copyPath: string,
  overwrite = false,
): Promise<boolean> => {
  try {
    await fs.copyFile(srcPath, copyPath, overwrite ? fsConst.COPYFILE_EXCL : 0);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    return false;
  }
};
/**
 * @returns null if database not exist
 */
export const getLatestDbCopyPath = async (
  dbPath: string,
): Promise<[path: string, version: number]> => {
  const mtime = (await fs.stat(dbPath)).mtimeMs;
  return [getCopyPath(dbPath, mtime), mtime];
};
// const isDbCopyAvailable = async (info: DBInfo) => {
//   try {
//     fs.stat(info.copyPath);
//   } catch (error) {
//     if ((error as NodeJS.ErrnoException).code === "ENOENT") {
//       return false;
//     } else throw error;
//   }
// };
const cleanupOldCopies = async (srcPath: string, copyPath: string) => {
  const dir = path.dirname(srcPath);
  for (const relatviePath of await fs.readdir(dir)) {
    const file = path.join(dir, relatviePath);
    if (
      file !== copyPath &&
      file.startsWith(copyPath) &&
      file.endsWith(OB_ZT_COPY_EXT)
    ) {
      fs.rm(file, { force: true });
    }
  }
};
