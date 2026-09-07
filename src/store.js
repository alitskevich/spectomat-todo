import { readFile, writeFile } from "fs/promises";

export async function readStore(filePath) {
  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch (e) {
    if (e.code === "ENOENT") return [];
    throw e;
  }
}

export async function writeStore(filePath, items) {
  await writeFile(filePath, JSON.stringify(items, null, 2) + "\n");
}
