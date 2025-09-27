import { useState, useRef, useEffect, useMemo } from 'react';
import { Send, Loader2, User, Bot, Settings, Code, FileText, Lightbulb, Brain, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useToast } from '@/hooks/use-toast';
import { AgentManager } from '@/lib/agents';
import type { AgentType, ChatMessage as AgentChatMessage } from '@/lib/agents/types';
import type { FileContents } from '@/hooks/useFileManagement';

interface ChatMessage extends AgentChatMessage {
  agentType?: AgentType;
}

interface AIChatPanelProps {
  fileContents: FileContents;
  updateFileContent?: (filename: string, content: string) => void;
  appId?: string;
}

// Agent icons mapping
const agentIcons: Record<AgentType, any> = {
  manager: Settings,
  editor: Code,
  architect: FileText,
  advisor: Lightbulb,
  shepherd: Eye,
};

// Agent colors mapping
const agentColors: Record<AgentType, string> = {
  manager: 'bg-blue-500',
  editor: 'bg-green-500',
  architect: 'bg-purple-500',
  advisor: 'bg-yellow-500',
  shepherd: 'bg-orange-500',
};

/**
 * AI Chat panel component for the editor with multi-agent support
 */
export function AIChatPanel({ fileContents, updateFileContent, appId }: AIChatPanelProps) {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentType | 'auto'>('auto');
  const [currentAgentProcessing, setCurrentAgentProcessing] = useState<AgentType | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Initialize AgentManager
  const agentManager = useMemo(() => new AgentManager(), []);
  
  // Get available agents
  const availableAgents = useMemo(() => agentManager.getAvailableAgents(), [agentManager]);

  // Auto scroll chat messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Handle agent actions (file edits, etc.)
  const handleAgentActions = async (actions: any[]) => {
    if (!actions || actions.length === 0) return;

    for (const action of actions) {
      if (action.type === 'file_edit' && updateFileContent) {
        updateFileContent(action.target, action.content);
        toast({
          title: "File Updated",
          description: `${action.target} has been modified by the agent.`
        });
      } else if (action.type === 'file_create' && updateFileContent) {
        updateFileContent(action.target, action.content);
        toast({
          title: "File Created",
          description: `${action.target} has been created by the agent.`
        });
      }
    }
  };

  // Chat with AI using the multi-agent system
  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      if (!appId || !currentWorkspace?.id) {
        throw new Error('Missing app ID or workspace');
      }

      // Convert FileContents to Record<string, string> for AgentManager
      const fileContentsRecord: Record<string, string> = {};
      Object.entries(fileContents).forEach(([filename, content]) => {
        fileContentsRecord[filename] = content;
      });

      if (selectedAgent === 'auto') {
        return await agentManager.processRequest(
          message,
          appId,
          fileContentsRecord,
          currentWorkspace.id
        );
      } else {
        return await agentManager.processWithAgent(
          selectedAgent as AgentType,
          message,
          appId,
          fileContentsRecord,
          currentWorkspace.id
        );
      }
    },
    onMutate: () => {
      setIsTyping(true);
      setCurrentAgentProcessing(selectedAgent === 'auto' ? 'manager' : selectedAgent as AgentType);
    },
    onSuccess: async (response) => {
      // Add user message
      const userMessage: ChatMessage = { 
        id: Date.now().toString(), 
        role: 'user', 
        content: chatInput, 
        createdAt: new Date().toISOString() 
      };

      // Add agent response
      const agentMessage: ChatMessage = { 
        id: (Date.now() + 1).toString(), 
        role: 'assistant', 
        content: response.content,
        agentType: currentAgentProcessing || 'manager',
        createdAt: new Date().toISOString() 
      };

      setChatMessages(prev => [...prev, userMessage, agentMessage]);

      // Handle any actions returned by the agent
      if (response.actions && response.actions.length > 0) {
        await handleAgentActions(response.actions);
      }

      setIsTyping(false);
      setCurrentAgentProcessing(null);
    },
    onError: (error) => {
      console.error('Chat error:', error);
      toast({
        title: "Error",
        description: "Failed to communicate with agents. Please try again.",
        variant: "destructive"
      });
      setIsTyping(false);
      setCurrentAgentProcessing(null);
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatMutation.isPending) return;

    chatMutation.mutate(chatInput);
    setChatInput('');
  };

  const getAgentIcon = (agentType?: AgentType) => {
    if (!agentType) return Bot;
    return agentIcons[agentType] || Bot;
  };

  const getAgentColor = (agentType?: AgentType) => {
    if (!agentType) return 'bg-primary';
    return agentColors[agentType] || 'bg-primary';
  };

  const getAgentName = (agentType?: AgentType) => {
    if (!agentType) return 'AI';
    return agentType.charAt(0).toUpperCase() + agentType.slice(1);
  };

  return (
    <div className="h-full flex flex-col border-r border-border">
      {/* Chat Header */}
      <div className="p-4 border-b border-border space-y-3">
        <div>
          <h2 className="font-semibold text-lg" data-testid="text-chat-title">AI Assistant</h2>
          <p className="text-sm text-muted-foreground">Multi-agent system for development help</p>
        </div>
        
        {/* Agent Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Agent:</label>
          <Select value={selectedAgent} onValueChange={(value) => setSelectedAgent(value as AgentType | 'auto')} data-testid="select-agent">
            <SelectTrigger>
              <SelectValue placeholder="Choose an agent" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Auto (Manager chooses)</SelectItem>
              {availableAgents.map((agent) => (
                <SelectItem key={agent.type} value={agent.type}>
                  {getAgentName(agent.type)} - {agent.description}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Agent Capabilities */}
        {selectedAgent !== 'auto' && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Capabilities:</label>
            <div className="flex flex-wrap gap-1">
              {availableAgents
                .find(agent => agent.type === selectedAgent)
                ?.capabilities.map((capability: string, index: number) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {capability}
                  </Badge>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatMessages.length === 0 && (
          <div className="text-center text-muted-foreground space-y-2">
            <p>Ask the AI agents anything about your app!</p>
            <div className="text-xs">
              <p><strong>Auto mode:</strong> Manager will route to the best agent</p>
              <p><strong>Direct mode:</strong> Talk directly to a specific agent</p>
            </div>
          </div>
        )}
        
        {chatMessages.map((message) => {
          const AgentIcon = getAgentIcon(message.agentType);
          
          return (
            <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {message.role === 'assistant' && (
                <Avatar className="w-8 h-8">
                  <AvatarFallback className={`${getAgentColor(message.agentType)} text-white text-xs`}>
                    <AgentIcon className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
              )}
              <div className={`max-w-[80%] ${message.role === 'user' ? 'bg-primary text-primary-foreground' : ''}`}>
                <Card>
                  {message.role === 'assistant' && message.agentType && (
                    <CardHeader className="pb-2">
                      <Badge variant="outline" className="w-fit">
                        <AgentIcon className="w-3 h-3 mr-1" />
                        {getAgentName(message.agentType)}
                      </Badge>
                    </CardHeader>
                  )}
                  <CardContent className={`${message.role === 'assistant' && message.agentType ? 'pt-0' : ''} p-3`}>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </CardContent>
                </Card>
              </div>
              {message.role === 'user' && (
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                    <User className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          );
        })}
        
        {isTyping && currentAgentProcessing && (
          <div className="flex gap-3 justify-start">
            <Avatar className="w-8 h-8">
              <AvatarFallback className={`${getAgentColor(currentAgentProcessing)} text-white text-xs`}>
                {(() => {
                  const Icon = getAgentIcon(currentAgentProcessing);
                  return <Icon className="w-4 h-4" />;
                })()}
              </AvatarFallback>
            </Avatar>
            <Card>
              <CardHeader className="pb-2">
                <Badge variant="outline" className="w-fit">
                  {(() => {
                    const Icon = getAgentIcon(currentAgentProcessing);
                    return <Icon className="w-3 h-3 mr-1" />;
                  })()}
                  {getAgentName(currentAgentProcessing)} is thinking...
                </Badge>
              </CardHeader>
              <CardContent className="pt-0 p-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <div className="p-4 border-t border-border">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Textarea
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder={selectedAgent === 'auto' 
              ? "Ask anything, the manager will route to the best agent..." 
              : `Ask ${getAgentName(selectedAgent as AgentType)} directly...`}
            className="min-h-[60px] resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
            data-testid="input-chat-message"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!chatInput.trim() || chatMutation.isPending}
            data-testid="button-send-chat"
          >
            {chatMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}