import fs from "node:fs/promises";
import path from "node:path";

export async function atomicWrite(
  filePath: string,
  content: string,
): Promise<void> {
  const tempPath = `${filePath}.tmp.${Date.now()}`;

  try {
    await Bun.write(tempPath, content);
    await fs.rename(tempPath, filePath);
  } catch (error) {
    try {
      await fs.unlink(tempPath);
    } catch {
      // Ignore cleanup errors
    }
    throw error;
  }
}

export async function safeRead(filePath: string): Promise<string> {
  const file = Bun.file(filePath);
  const exists = await file.exists();

  if (!exists) {
    const fileName = path.basename(filePath);
    throw new Error(
      `File not found: ${fileName}. ` +
        `Expected location: ${filePath}. ` +
        `Make sure the file exists and the script is run from the correct directory.`,
    );
  }

  try {
    return await file.text();
  } catch (error) {
    const fileName = path.basename(filePath);
    throw new Error(
      `Failed to read ${fileName}: ${error instanceof Error ? error.message : String(error)}. ` +
        `Check file permissions and ensure it's not locked by another process.`,
    );
  }
}

export async function validateFileExists(filePath: string): Promise<boolean> {
  const file = Bun.file(filePath);
  const exists = await file.exists();

  if (!exists) {
    const fileName = path.basename(filePath);
    throw new Error(
      `Required file not found: ${fileName}. ` +
        `Expected location: ${filePath}. ` +
        `Create the file or verify the path is correct.`,
    );
  }

  return true;
}
