import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { SkmVault } from "@/lib/security/skm";
import { getDatabase, closeDatabase } from "@/lib/db";

describe("SKM Vault (Secure Key Management)", () => {
  beforeEach(() => {
    process.env.TEST_DB = "memory";
    process.env.SKM_MASTER_KEY = "test-master-kek-32bytes-secret-string!";
    const db = getDatabase();
    // Ensure test workspace exists for foreign key constraint
    const now = new Date().toISOString();
    db.prepare(`
      INSERT OR IGNORE INTO workspaces (id, name, created_at, retention_policy_days)
      VALUES ('ws_test', 'Test Workspace', ?, 30)
    `).run(now);
  });

  afterEach(() => {
    closeDatabase();
  });

  it("encrypts and decrypts secret using AES-256-GCM envelope encryption", () => {
    const rawKey = "AIzaSy_fake_test_gemini_key_12345678";
    const context = "ws_test_1:gemini";

    const payload = SkmVault.encryptSecret(rawKey, context);
    expect(payload.ciphertext).toBeDefined();
    expect(payload.wrappedDek).toBeDefined();
    expect(payload.nonce).toBeDefined();
    expect(payload.keyVersion).toBe(1);

    // Verify ciphertext does NOT contain plaintext
    expect(payload.ciphertext).not.toContain(rawKey);

    // Decrypt
    const decrypted = SkmVault.decryptSecret(payload, context);
    expect(decrypted).toBe(rawKey);
  });

  it("fails decryption if context or ciphertext is tampered with (AAD verification)", () => {
    const rawKey = "AIzaSy_test_key";
    const payload = SkmVault.encryptSecret(rawKey, "tenant_a:gemini");

    // Tampering context (AAD mismatch)
    expect(() => {
      SkmVault.decryptSecret(payload, "tenant_b:gemini");
    }).toThrow();
  });

  it("stores encrypted provider secret, rotates key, and returns masked status", () => {
    const rawKey1 = "AIzaSy_first_key_9999";
    const res1 = SkmVault.setProviderKey("ws_test", "gemini", rawKey1);
    expect(res1.keyVersion).toBe(1);
    expect(res1.label).toContain("9999");

    const status1 = SkmVault.getProviderStatus("ws_test", "gemini");
    expect(status1.configured).toBe(true);
    expect(status1.label).toContain("9999");
    expect(status1.keyVersion).toBe(1);

    // Rotate
    const rawKey2 = "AIzaSy_second_key_8888";
    const res2 = SkmVault.setProviderKey("ws_test", "gemini", rawKey2);
    expect(res2.keyVersion).toBe(2);
    expect(res2.label).toContain("8888");

    const status2 = SkmVault.getProviderStatus("ws_test", "gemini");
    expect(status2.keyVersion).toBe(2);
    expect(status2.label).toContain("8888");

    // Resolved key matches latest
    const resolved = SkmVault.resolveKey("ws_test", "gemini");
    expect(resolved).toBe(rawKey2);
  });
});
