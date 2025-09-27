import { BaseAgent } from './BaseAgent';
import type { AgentContext, AgentResponse, TaskContext, AgentType } from './types';

export class ManagerAgent extends BaseAgent {
  constructor() {
    super('manager', {
      canEditFiles: false,
      canAnalyzeCode: true,
      canProvideGuidance: true,
      canCoordinate: true,
      canMakeDecisions: true
    }, `You are the Manager Agent responsible for coordinating the multi-agent system.
Your role is to:
- Analyze incoming requests and determine the best agent to handle them
- Break down complex tasks into manageable subtasks
- Coordinate between different agents
- Ensure tasks are completed efficiently
- Make strategic decisions about approach and priority`);
  }

  async process(context: AgentContext): Promise<AgentResponse> {
    const task = this.analyzeTask(context);
    const bestAgent = this.selectBestAgent(context, task);
    
    if (bestAgent !== 'manager') {
      return this.formatResponse(
        `I've analyzed your request: "${context.userMessage}"\n\n` +
        `**Task Analysis:**\n` +
        `- Complexity: ${task.complexity}\n` +
        `- Scope: ${task.scope}\n` +
        `- Estimated Time: ${task.estimatedTime}\n\n` +
        `I'm delegating this to the **${bestAgent}** agent who is best suited for this type of task.`,
        [],
        false
      );
    }

    // Handle coordination tasks that require manager oversight
    return this.formatResponse(
      `I'll coordinate this complex task that requires multiple agents:\n\n` +
      `**Coordination Plan:**\n` +
      `1. Architect will analyze the current structure\n` +
      `2. Advisor will provide best practices recommendations\n` +
      `3. Editor will implement the changes\n` +
      `4. Shepherd will ensure quality and completion\n\n` +
      `Let's start with the Architect's analysis.`,
      [],
      false
    );
  }

  protected isCapableOf(task: TaskContext): boolean {
    // Manager handles coordination and complex multi-agent tasks
    return task.complexity === 'architectural' || task.scope === 'full-app';
  }

  private selectBestAgent(context: AgentContext, task: TaskContext): AgentType {
    const { userMessage } = context;
    const message = userMessage.toLowerCase();

    // Direct editing requests go to Editor
    if (message.includes('edit') || message.includes('change') || message.includes('update') || 
        message.includes('fix') || message.includes('add') || message.includes('remove')) {
      if (task.complexity === 'simple' || task.complexity === 'moderate') {
        return 'editor';
      }
    }

    // Architecture questions go to Architect
    if (message.includes('architecture') || message.includes('structure') || 
        message.includes('organize') || message.includes('design pattern') ||
        message.includes('best way to')) {
      return 'architect';
    }

    // Advice and recommendations go to Advisor
    if (message.includes('should i') || message.includes('recommend') || 
        message.includes('best practice') || message.includes('advice') ||
        message.includes('how to')) {
      return 'advisor';
    }

    // Quality assurance and guidance goes to Shepherd
    if (message.includes('review') || message.includes('check') || 
        message.includes('validate') || message.includes('quality')) {
      return 'shepherd';
    }

    // Complex or unclear tasks need manager coordination
    if (task.complexity === 'architectural' || task.scope === 'full-app') {
      return 'manager';
    }

    // Default to editor for simple implementation tasks
    return 'editor';
  }
}