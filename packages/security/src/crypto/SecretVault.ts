export class SecretVault {
  /**
   * Interacts with KMS / Vault. Never hardcodes secrets.
   */
  static async getSecret(keyName: string): Promise<string> {
    // 1. Retrieve from safe environment context
    const secret = process.env[keyName];
    if (!secret) {
      throw new Error(`[CRYPTOGRAPHIC GOVERNANCE] Secret ${keyName} is missing from Vault!`);
    }
    return secret;
  }
}
