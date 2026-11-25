import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export interface StorageObjectMeta {
  key: string;
  sha256: string;
  sizeBytes: number;
  mimeType: string;
}

export class ObjectStorage {
  private static baseDir: string = path.resolve(process.cwd(), "storage");

  private static ensureDirs(): void {
    const uploadsDir = path.join(this.baseDir, "uploads");
    const derivativesDir = path.join(this.baseDir, "derivatives");
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
    if (!fs.existsSync(derivativesDir)) fs.mkdirSync(derivativesDir, { recursive: true });
  }

  /**
   * Stores raw original media bytes into private object storage.
   * Computes cryptographic SHA-256 hash.
   */
  static async putObject(
    buffer: Buffer,
    filename: string,
    mimeType: string,
    isDerivative: boolean = false
  ): Promise<StorageObjectMeta> {
    this.ensureDirs();

    const sha256 = crypto.createHash("sha256").update(buffer).digest("hex");
    const ext = path.extname(filename) || ".bin";
    const subfolder = isDerivative ? "derivatives" : "uploads";
    const key = `${subfolder}/${sha256.slice(0, 8)}_${Date.now()}${ext}`;
    const fullPath = path.join(this.baseDir, key);

    fs.writeFileSync(fullPath, buffer);

    return {
      key,
      sha256,
      sizeBytes: buffer.length,
      mimeType,
    };
  }

  /**
   * Reads raw bytes from object storage.
   */
  static async getObject(key: string): Promise<Buffer | null> {
    const fullPath = path.join(this.baseDir, key);
    if (!fs.existsSync(fullPath)) {
      return null;
    }
    return fs.readFileSync(fullPath);
  }

  /**
   * Deletes an object permanently.
   */
  static async deleteObject(key: string): Promise<boolean> {
    const fullPath = path.join(this.baseDir, key);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      return true;
    }
    return false;
  }
}
