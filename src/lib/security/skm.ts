import crypto from "node:crypto";
import { getDatabase } from "@/lib/db";
import type { ProviderSecret } from "@/types/domain";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits

// Fallback master KEK for local/dev if external KMS not configured
function getMasterKek(): Buffer {
  const masterSecret = process.env.SKM_MASTER_KEY || "truthlens-dev-insecure-master-kek-32bytes-secret!";
  return crypto.createHash("sha256").update(masterSecret).digest();
}

export interface EncryptedSecretPayload {
  ciphertext: string;
  nonce: string;
  wrappedDek: string;
  kekId: string;
  keyVersion: number;
}

export class SkmVault {
  /**
   * Encrypts plaintext secret using envelope encryption (AES-256-GCM).
   * Generates a unique DEK for the secret, encrypts with DEK,
   * then wraps DEK with the master KEK.
   */
  static encryptSecret(plaintext: string, contextId: string): EncryptedSecretPayload {
    const masterKek = getMasterKek();
    const dek = crypto.randomBytes(32); // 256-bit DEK
    const dekIv = crypto.randomBytes(IV_LENGTH);

    // 1. Wrap DEK with KEK
    const dekCipher = crypto.createCipheriv(ALGORITHM, masterKek, dekIv);
    dekCipher.setAAD(Buffer.from(`dek-wrap:${contextId}`, "utf-8"));
    const wrappedDekData = Buffer.concat([dekCipher.update(dek), dekCipher.final()]);
    const dekAuthTag = dekCipher.getAuthTag();
    const packedWrappedDek = Buffer.concat([dekIv, dekAuthTag, wrappedDekData]).toString("base64");

    // 2. Encrypt plaintext secret with DEK
    const secretIv = crypto.randomBytes(IV_LENGTH);
    const secretCipher = crypto.createCipheriv(ALGORITHM, dek, secretIv);
    secretCipher.setAAD(Buffer.from(`payload:${contextId}`, "utf-8"));
    const encryptedSecretData = Buffer.concat([secretCipher.update(plaintext, "utf-8"), secretCipher.final()]);
    const secretAuthTag = secretCipher.getAuthTag();

    return {
      ciphertext: Buffer.concat([secretAuthTag, encryptedSecretData]).toString("base64"),
      nonce: secretIv.toString("base64"),
      wrappedDek: packedWrappedDek,
      kekId: process.env.SKM_KEY_ID || "kek_dev_local_v1",
      keyVersion: 1,
    };
  }

  /**
   * Decrypts ciphertext in memory for provider invocation.
   * NEVER returns to client or writes to logs.
   */
  static decryptSecret(payload: EncryptedSecretPayload, contextId: string): string {
    const masterKek = getMasterKek();

    // 1. Unwrap DEK
    const packedWrappedDekBuf = Buffer.from(payload.wrappedDek, "base64");
    const dekIv = packedWrappedDekBuf.subarray(0, IV_LENGTH);
    const dekAuthTag = packedWrappedDekBuf.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const wrappedDekData = packedWrappedDekBuf.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

    const dekDecipher = crypto.createDecipheriv(ALGORITHM, masterKek, dekIv);
    dekDecipher.setAAD(Buffer.from(`dek-wrap:${contextId}`, "utf-8"));
    dekDecipher.setAuthTag(dekAuthTag);
    const dek = Buffer.concat([dekDecipher.update(wrappedDekData), dekDecipher.final()]);

    // 2. Decrypt secret payload
    const secretIv = Buffer.from(payload.nonce, "base64");
    const packedSecretBuf = Buffer.from(payload.ciphertext, "base64");
    const secretAuthTag = packedSecretBuf.subarray(0, AUTH_TAG_LENGTH);
    const encryptedSecretData = packedSecretBuf.subarray(AUTH_TAG_LENGTH);

    const secretDecipher = crypto.createDecipheriv(ALGORITHM, dek, secretIv);
    secretDecipher.setAAD(Buffer.from(`payload:${contextId}`, "utf-8"));
    secretDecipher.setAuthTag(secretAuthTag);
    const decrypted = Buffer.concat([secretDecipher.update(encryptedSecretData), secretDecipher.final()]);

    return decrypted.toString("utf-8");
  }

  /**
   * Saves or updates a provider secret in the vault.
   */
  static setProviderKey(
    workspaceId: string | null,
    provider: "gemini" | "openrouter",
    plaintextKey: string
  ): { id: string; provider: string; label: string; keyVersion: number } {
    const db = getDatabase();
    const contextId = workspaceId ? `${workspaceId}:${provider}` : `global:${provider}`;
    const encrypted = this.encryptSecret(plaintextKey, contextId);

    const lastFour = plaintextKey.slice(-4).padStart(plaintextKey.length > 4 ? 8 : 4, "*");
    const label = `${provider.toUpperCase()} (${lastFour})`;
    const id = `sec_${crypto.randomUUID()}`;
    const now = new Date().toISOString();

    // Check if existing
    const existing = db
      .prepare("SELECT id, key_version FROM provider_secrets WHERE provider = ? AND (workspace_id = ? OR (workspace_id IS NULL AND ? IS NULL))")
      .get(provider, workspaceId, workspaceId) as { id: string; key_version: number } | undefined;

    if (existing) {
      const nextVersion = existing.key_version + 1;
      db.prepare(`
        UPDATE provider_secrets
        SET label = ?, ciphertext = ?, nonce = ?, wrapped_dek = ?, kek_id = ?, key_version = ?, status = 'active', rotated_at = ?
        WHERE id = ?
      `).run(label, encrypted.ciphertext, encrypted.nonce, encrypted.wrappedDek, encrypted.kekId, nextVersion, now, existing.id);

      return { id: existing.id, provider, label, keyVersion: nextVersion };
    } else {
      db.prepare(`
        INSERT INTO provider_secrets
        (id, workspace_id, provider, label, ciphertext, nonce, wrapped_dek, kek_id, key_version, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)
      `).run(id, workspaceId, provider, label, encrypted.ciphertext, encrypted.nonce, encrypted.wrappedDek, encrypted.kekId, encrypted.keyVersion, now);

      return { id, provider, label, keyVersion: 1 };
    }
  }

  /**
   * Gets masked secret metadata for UI/settings.
   * NEVER reveals ciphertext, plaintext, or encryption keys.
   */
  static getProviderStatus(workspaceId: string | null, provider: "gemini" | "openrouter") {
    const db = getDatabase();
    const row = db
      .prepare(`
        SELECT id, provider, label, status, key_version, created_at, rotated_at
        FROM provider_secrets
        WHERE provider = ? AND (workspace_id = ? OR (workspace_id IS NULL AND ? IS NULL))
      `)
      .get(provider, workspaceId, workspaceId) as Omit<ProviderSecret, "ciphertext" | "nonce" | "wrappedDek" | "kekId"> | undefined;

    // Also check if environment variable exists as fallback
    const envVarName = provider === "gemini" ? "GEMINI_API_KEY" : "OPENROUTER_API_KEY";
    const hasEnv = Boolean(process.env[envVarName]);

    if (!row && !hasEnv) {
      return {
        provider,
        configured: false,
        status: "unconfigured",
        source: null,
      };
    }

    return {
      provider,
      configured: true,
      status: (row as any)?.status || "active",
      source: row ? "vault" : "env",
      label: (row as any)?.label || `${provider.toUpperCase()} (from ENV)`,
      keyVersion: (row as any)?.key_version ?? (row as any)?.keyVersion ?? 1,
      createdAt: (row as any)?.created_at ?? (row as any)?.createdAt ?? null,
      rotatedAt: (row as any)?.rotated_at ?? (row as any)?.rotatedAt ?? null,
    };
  }

  /**
   * Resolves provider key for backend worker execution only.
   */
  static resolveKey(workspaceId: string | null, provider: "gemini" | "openrouter"): string | null {
    const db = getDatabase();
    const row = db
      .prepare(`
        SELECT ciphertext, nonce, wrapped_dek, kek_id, key_version
        FROM provider_secrets
        WHERE provider = ? AND status = 'active' AND (workspace_id = ? OR (workspace_id IS NULL AND ? IS NULL))
        ORDER BY created_at DESC
        LIMIT 1
      `)
      .get(provider, workspaceId, workspaceId) as {
        ciphertext: string;
        nonce: string;
        wrapped_dek: string;
        kek_id: string;
        key_version: number;
      } | undefined;

    if (row) {
      const contextId = workspaceId ? `${workspaceId}:${provider}` : `global:${provider}`;
      return this.decryptSecret(
        {
          ciphertext: row.ciphertext,
          nonce: row.nonce,
          wrappedDek: row.wrapped_dek,
          kekId: row.kek_id,
          keyVersion: row.key_version,
        },
        contextId
      );
    }

    // Fall back to environment variable if present
    const envVarName = provider === "gemini" ? "GEMINI_API_KEY" : "OPENROUTER_API_KEY";
    return process.env[envVarName] || null;
  }
}
