// Core types for the multi-agent system

export interface AgentContext {
  appId: string;
  fileContents: Record<string, string>;
  userMessage: string;
  conversationHistory: ChatMessage[];
  workspaceId: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  agentType?: AgentType;
  createdAt: string;
}

export interface AgentResponse {
  content: string;
  actions?: AgentAction[];
  shouldDelegate?: {
    to: AgentType;
    reason: string;
    context: string;
  };
  completed: boolean;
}

export interface AgentAction {
  type: 'file_edit' | 'file_create' | 'file_delete' | 'analysis' | 'recommendation';
  target: string; // filename or component
  content: string;
  reason: string;
}

export type AgentType = 'manager' | 'shepherd' | 'advisor' | 'architect' | 'editor';

export interface AgentCapabilities {
  canEditFiles: boolean;
  canAnalyzeCode: boolean;
  canProvideGuidance: boolean;
  canCoordinate: boolean;
  canMakeDecisions: boolean;
}

export interface TaskContext {
  priority: 'low' | 'medium' | 'high' | 'urgent';
  complexity: 'simple' | 'moderate' | 'complex' | 'architectural';
  scope: 'single-file' | 'multi-file' | 'structural' | 'full-app';
  estimatedTime: string;
}