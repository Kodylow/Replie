import type { AgentContext, AgentResponse, AgentCapabilities, AgentType, TaskContext } from './types';

export abstract class BaseAgent {
  protected agentType: AgentType;
  protected capabilities: AgentCapabilities;
  protected systemPrompt: string;

  constructor(agentType: AgentType, capabilities: AgentCapabilities, systemPrompt: string) {
    this.agentType = agentType;
    this.capabilities = capabilities;
    this.systemPrompt = systemPrompt;
  }

  abstract process(context: AgentContext): Promise<AgentResponse>;

  /**
   * Analyze the task complexity and determine if this agent can handle it
   */
  protected analyzeTask(context: AgentContext): TaskContext {
    const { userMessage, fileContents } = context;
    
    // Analyze complexity based on request
    let complexity: TaskContext['complexity'] = 'simple';
    let scope: TaskContext['scope'] = 'single-file';
    let priority: TaskContext['priority'] = 'medium';
    
    // Keywords that indicate different complexity levels
    const complexKeywords = ['refactor', 'restructure', 'architecture', 'database', 'api'];
    const moderateKeywords = ['component', 'function', 'style', 'layout', 'feature'];
    const structuralKeywords = ['folder', 'organize', 'structure', 'framework'];
    const multiFileKeywords = ['across files', 'multiple files', 'all files'];
    
    const message = userMessage.toLowerCase();
    
    if (complexKeywords.some(keyword => message.includes(keyword))) {
      complexity = 'architectural';
      scope = 'full-app';
      priority = 'high';
    } else if (moderateKeywords.some(keyword => message.includes(keyword))) {
      complexity = 'moderate';
      scope = 'multi-file';
    } else if (structuralKeywords.some(keyword => message.includes(keyword))) {
      complexity = 'complex';
      scope = 'structural';
    } else if (multiFileKeywords.some(keyword => message.includes(keyword))) {
      scope = 'multi-file';
    }
    
    // Estimate time based on complexity and scope
    let estimatedTime = '5-10 minutes';
    if (complexity === 'architectural') estimatedTime = '30-60 minutes';
    else if (complexity === 'complex') estimatedTime = '15-30 minutes';
    else if (complexity === 'moderate') estimatedTime = '10-20 minutes';
    
    return { complexity, scope, priority, estimatedTime };
  }

  /**
   * Check if this agent can handle the given task
   */
  canHandle(context: AgentContext): boolean {
    const task = this.analyzeTask(context);
    return this.isCapableOf(task);
  }

  protected abstract isCapableOf(task: TaskContext): boolean;

  /**
   * Get the agent's identity and role description
   */
  getIdentity(): { type: AgentType; role: string; capabilities: AgentCapabilities } {
    return {
      type: this.agentType,
      role: this.systemPrompt.split('\n')[0] || 'AI Assistant',
      capabilities: this.capabilities
    };
  }

  /**
   * Format response with agent context
   */
  protected formatResponse(content: string, actions: any[] = [], completed: boolean = true): AgentResponse {
    return {
      content: `**${this.getAgentName()}**: ${content}`,
      actions,
      completed
    };
  }

  private getAgentName(): string {
    return this.agentType.charAt(0).toUpperCase() + this.agentType.slice(1);
  }
}