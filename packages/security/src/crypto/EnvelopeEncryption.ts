import { SecretVault } from './SecretVault';
import crypto from 'crypto';

export class EnvelopeEncryption {
  /**
   * Field-level encryption for PII.
   * Generates a unique DEK (Data Encryption Key) per tenant,
   * encrypted by the Master KEK (Key Encryption Key).
   */
  static encrypt(plaintext: string, tenantId: string): string {
    // 1. In reality, fetch tenant KEK
    // 2. Generate random IV
    const iv = crypto.randomBytes(16);
    const key = crypto.scryptSync(tenantId + "master_salt", 'salt', 32); // Mock safe derivation
    
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    // 3. Store IV + AuthTag + Ciphertext
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  static decrypt(cipherBundle: string, tenantId: string): string {
    const parts = cipherBundle.split(':');
    if (parts.length !== 3) throw new Error("Invalid cipher bundle");

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encryptedText = Buffer.from(parts[2], 'hex');

    const key = crypto.scryptSync(tenantId + "master_salt", 'salt', 32); 

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedText, undefined, 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
