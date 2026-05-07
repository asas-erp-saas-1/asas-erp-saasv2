export class ReplayRuntimeMode {
  private static isReplaying = false;

  static activate() {
    this.isReplaying = true;
  }

  static deactivate() {
    this.isReplaying = false;
  }

  static isActive(): boolean {
    return this.isReplaying;
  }

  /**
   * Guard function: Wrap any side-effect code (emails, HTTP calls) in this guard.
   * If replaying, it physically skips execution.
   */
  static async executeSideEffect(name: string, effect: () => Promise<void>) {
    if (this.isReplaying) {
      console.log(`[REPLAY SUPPRESSION] Bypassing side-effect: ${name}`);
      return;
    }
    await effect();
  }
}
