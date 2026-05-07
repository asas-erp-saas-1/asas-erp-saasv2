import { KernelContext } from '../../../kernel/src/ContextHydrator';
import { HumanInTheLoopGovernor } from './HumanInTheLoopGovernor';

export class AgentCommandOrchestrator {
  /**
   * Translates the output of a Large Language Model into deterministic, replayable Kernel Commands.
   */
  static async brokerAgentIntent(agentId: string, tenantId: string, llmOutputJson: any, ctx: KernelContext): Promise<void> {
     console.log(`[AI AGENT FABRIC] Brokering intent from autonomous agent ${agentId}`);

     const intent = typeof llmOutputJson === 'string' ? JSON.parse(llmOutputJson) : llmOutputJson;

     // E.g., The LLM decides to move a deal to "won"
     if (intent.action === 'SET_DEAL_STAGE') {
         
         // 1. Check HITL Governance for specific destructive / critical actions
         const requiresApproval = HumanInTheLoopGovernor.requiresHumanApproval(intent.action);

         if (requiresApproval) {
             await HumanInTheLoopGovernor.enqueueForApproval(tenantId, agentId, intent);
             return; // Execution physically halts until async human approval loop completes
         }

         // 2. Dispatch to Kernel (Mocked)
         console.log(`[AI AGENT FABRIC] Agent ${agentId} autonomously executing ${intent.action} for Deal ${intent.payload.dealId}`);
     }
  }
}
