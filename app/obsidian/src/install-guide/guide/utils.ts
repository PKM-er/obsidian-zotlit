import { createWriteStream } from "fs";
import { rm } from "fs/promises";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
import { createGunzip } from "zlib";
import { app as electronApp } from "@electron/remote";
import { fileDialog } from "file-select-dialog";
import { requestUrl } from "obsidian";

export const importModule = async (
  ab: ArrayBuffer,
  writeTo: string,
  decompressed: boolean,
): Promise<void> => {
  const source = Readable.from(Buffer.from(ab)),
    target = createWriteStream(writeTo);
  try {
    if (decompressed) {
      await pipeline(source, target);
    } else {
      await pipeline(source, createGunzip(), target);
    }
  } catch (error) {
    target.destroy();
    await rm(writeTo, { force: true });
    throw error;
  }
};

export const uploadModule = async () => {
  const file = await fileDialog({
    multiple: false,
    accept: [".gz", ".node"],
    strict: true,
  });
  if (!file) return null;
  const decompressed = !file.name.endsWith(".gz");
  return { decompressed, arrayBuffer: await file.arrayBuffer() };
};

export const checkModuleStatus = async (url: string): Promise<number> => {
  const response = await fetch(url, { method: "HEAD" });
  return response.status;
};

export const downloadModule = async (url: string): Promise<ArrayBuffer> => {
  const response = await requestUrl({ url });
  return response.arrayBuffer;
};

export const restartApp = () => {
  // to avoid weird bug that require() parse path string as binary
  // and throw error if it contains non-ascii characters
  // if require() being called to same path twice
  // we need to restart app to clear require cache
  electronApp.relaunch();
  electronApp.exit();
};
