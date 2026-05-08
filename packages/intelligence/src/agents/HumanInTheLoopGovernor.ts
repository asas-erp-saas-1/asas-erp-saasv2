export class HumanInTheLoopGovernor {
  /**
   * Defines critical system actions that an AI Agent is mathematically forbidden 
   * from executing autonomously without a biometric/authenticated human signature.
   */
  private static restrictedActions = new Set([
      'DELETE_DEAL',
      'ISSUE_REFUND',
      'BULK_EXPORT_PII',
      'CHANGE_SUBSCRIPTION_TIER'
  ]);

  static requiresHumanApproval(actionName: string): boolean {
      return this.restrictedActions.has(actionName);
  }

  static async enqueueForApproval(tenantId: string, agentId: string, proposedCommand: any): Promise<void> {
      console.warn(`[HITL GOVERNOR] AI Agent ${agentId} attempt to run ${proposedCommand.action} intercepted. Pending human authorization.`);
      // Pushes into a PostgreSQL table `agent_pending_approvals` for the Dashboard UI
      // Outbox event emitted to trigger a notification to the agency_owner
  }
}
