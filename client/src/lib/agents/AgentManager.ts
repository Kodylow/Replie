import { ManagerAgent } from './ManagerAgent';
import { EditorAgent } from './EditorAgent';
import { ArchitectAgent } from './ArchitectAgent';
import { AdvisorAgent } from './AdvisorAgent';
import { ShepherdAgent } from './ShepherdAgent';
import type { AgentContext, AgentResponse, AgentType, ChatMessage } from './types';

export class AgentManager {
  private agents: Map<AgentType, any>;
  private conversationHistory: ChatMessage[] = [];

  constructor() {
    this.agents = new Map();
    this.agents.set('manager', new ManagerAgent());
    this.agents.set('editor', new EditorAgent());
    this.agents.set('architect', new ArchitectAgent());
    this.agents.set('advisor', new AdvisorAgent());
    this.agents.set('shepherd', new ShepherdAgent());
  }

  /**
   * Process a user request through the multi-agent system
   */
  async processRequest(
    userMessage: string,
    appId: string,
    fileContents: Record<string, string>,
    workspaceId: string
  ): Promise<AgentResponse> {
    const context: AgentContext = {
      appId,
      fileContents,
      userMessage,
      conversationHistory: this.conversationHistory,
      workspaceId
    };

    // Add user message to conversation history
    this.addToHistory({
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      createdAt: new Date().toISOString()
    });

    // Start with Manager to determine the best agent
    const manager = this.agents.get('manager');
    const initialResponse = await manager.process(context);

    // Check if manager wants to delegate
    if (initialResponse.shouldDelegate) {
      const delegatedAgent = this.agents.get(initialResponse.shouldDelegate.to);
      if (delegatedAgent) {
        const delegatedResponse = await delegatedAgent.process(context);
        
        // Add both manager and delegated agent responses to history
        this.addToHistory({
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: initialResponse.content,
          agentType: 'manager',
          createdAt: new Date().toISOString()
        });

        this.addToHistory({
          id: (Date.now() + 2).toString(),
          role: 'assistant',
          content: delegatedResponse.content,
          agentType: initialResponse.shouldDelegate.to,
          createdAt: new Date().toISOString()
        });

        return delegatedResponse;
      }
    }

    // Add manager response to history
    this.addToHistory({
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: initialResponse.content,
      agentType: 'manager',
      createdAt: new Date().toISOString()
    });

    return initialResponse;
  }

  /**
   * Process a request with a specific agent
   */
  async processWithAgent(
    agentType: AgentType,
    userMessage: string,
    appId: string,
    fileContents: Record<string, string>,
    workspaceId: string
  ): Promise<AgentResponse> {
    const context: AgentContext = {
      appId,
      fileContents,
      userMessage,
      conversationHistory: this.conversationHistory,
      workspaceId
    };

    const agent = this.agents.get(agentType);
    if (!agent) {
      throw new Error(`Agent type '${agentType}' not found`);
    }

    const response = await agent.process(context);
    
    // Add to conversation history
    this.addToHistory({
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      createdAt: new Date().toISOString()
    });

    this.addToHistory({
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response.content,
      agentType,
      createdAt: new Date().toISOString()
    });

    return response;
  }

  /**
   * Get available agents and their capabilities
   */
  getAvailableAgents() {
    const agentInfo: any[] = [];
    this.agents.forEach((agent, type) => {
      agentInfo.push({
        type,
        ...agent.getIdentity()
      });
    });
    return agentInfo;
  }

  /**
   * Get conversation history
   */
  getConversationHistory(): ChatMessage[] {
    return [...this.conversationHistory];
  }

  /**
   * Clear conversation history
   */
  clearHistory() {
    this.conversationHistory = [];
  }

  /**
   * Execute agent actions (file edits, etc.)
   * @param actions Array of actions to execute
   * @param fileContents Current file contents
   * @param agentType The type of agent executing the actions
   * @param saveFiles Optional function to save files with agent context
   * @returns Updated file contents and execution metadata
   */
  async executeActions(
    actions: any[],
    fileContents: Record<string, string>,
    agentType?: AgentType,
    saveFiles?: (agentContext: any, actionDescription?: string) => Promise<any>
  ): Promise<{ 
    updatedFiles: Record<string, string>; 
    agentContext?: {
      agentType: AgentType;
      agentName: string;
      actionDescription: string;
    };
    shouldSave: boolean;
  }> {
    const updatedFiles = { ...fileContents };
    const fileActions: string[] = [];
    let shouldSave = false;

    for (const action of actions) {
      if (action.type === 'file_edit') {
        updatedFiles[action.target] = action.content;
        fileActions.push(`Modified ${action.target}`);
        shouldSave = true;
      } else if (action.type === 'file_create') {
        updatedFiles[action.target] = action.content;
        fileActions.push(`Created ${action.target}`);
        shouldSave = true;
      } else if (action.type === 'file_delete') {
        delete updatedFiles[action.target];
        fileActions.push(`Deleted ${action.target}`);
        shouldSave = true;
      }
    }

    let agentContext;
    if (shouldSave && agentType) {
      // Create agent context for attribution
      const agentName = this.getAgentDisplayName(agentType);
      const actionDescription = fileActions.length > 0 
        ? fileActions.join(', ') 
        : 'Applied file changes';

      agentContext = {
        agentType,
        agentName,
        actionDescription
      };

      // If saveFiles function is provided, save with agent context
      if (saveFiles) {
        try {
          await saveFiles(agentContext, actionDescription);
        } catch (error) {
          console.error('Failed to save files with agent context:', error);
          // Continue execution even if save fails
        }
      }
    }

    return {
      updatedFiles,
      agentContext,
      shouldSave
    };
  }

  /**
   * Get display name for an agent type
   */
  private getAgentDisplayName(agentType: AgentType): string {
    switch (agentType) {
      case 'manager': return 'Manager Agent';
      case 'editor': return 'Editor Agent';
      case 'architect': return 'Architect Agent';
      case 'advisor': return 'Advisor Agent';
      case 'shepherd': return 'Shepherd Agent';
      default: return 'Unknown Agent';
    }
  }

  private addToHistory(message: ChatMessage) {
    this.conversationHistory.push(message);
    
    // Keep history to reasonable size (last 50 messages)
    if (this.conversationHistory.length > 50) {
      this.conversationHistory = this.conversationHistory.slice(-50);
    }
  }
}