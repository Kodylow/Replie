// Export all agent-related classes and types
export { AgentManager } from './AgentManager';
export { BaseAgent } from './BaseAgent';
export { ManagerAgent } from './ManagerAgent';
export { EditorAgent } from './EditorAgent';
export { ArchitectAgent } from './ArchitectAgent';
export { AdvisorAgent } from './AdvisorAgent';
export { ShepherdAgent } from './ShepherdAgent';

export type {
  AgentContext,
  AgentResponse,
  AgentAction,
  AgentType,
  AgentCapabilities,
  TaskContext,
  ChatMessage
} from './types';