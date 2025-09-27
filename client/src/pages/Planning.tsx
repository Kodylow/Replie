import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { Send, ArrowLeft, Clock, Zap } from 'lucide-react';
import type { ChatMessage, ChatConversation } from '@shared/schema';

interface ChatResponse {
  conversation: ChatConversation;
  userMessage: ChatMessage;
  assistantMessage: ChatMessage;
  showModeSelection: boolean;
}

interface ModeSelectionResponse {
  conversation: ChatConversation;
  message: string;
}

export default function Planning() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [showModeSelection, setShowModeSelection] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest('POST', '/api/chat/planning', {
        message,
        conversationId,
        workspaceId: currentWorkspace?.id,
      });
      return await response.json() as ChatResponse;
    },
    onMutate: () => {
      setIsTyping(true);
    },
    onSuccess: (data) => {
      setConversationId(data.conversation.id);
      setMessages(prev => [...prev, data.userMessage, data.assistantMessage]);
      setShowModeSelection(data.showModeSelection);
      setIsTyping(false);
    },
    onError: (error) => {
      console.error('Chat error:', error);
      setIsTyping(false);
    },
  });

  const modeSelectionMutation = useMutation({
    mutationFn: async (mode: 'design' | 'build') => {
      const response = await apiRequest('POST', '/api/chat/mode-selection', {
        conversationId,
        selectedMode: mode,
      });
      return await response.json() as ModeSelectionResponse;
    },
    onSuccess: (data) => {
      setShowModeSelection(false);
      // Navigate away or show completion message
      setLocation('/');
    },
  });

  const createAppMutation = useMutation({
    mutationFn: async () => {
      if (!currentWorkspace?.id) throw new Error('No workspace selected');
      
      // Extract project title from conversation or use default
      const lastMessage = messages[messages.length - 1];
      const projectTitle = lastMessage?.content?.split('\n')[0] || 'My App';
      
      const response = await apiRequest('POST', `/api/workspaces/${currentWorkspace.id}/apps`, {
        title: projectTitle,
        creator: user?.firstName || 'User',
        isPublished: 'false',
        isPrivate: 'true',
        backgroundColor: 'bg-gradient-to-br from-blue-500 to-purple-600'
      });
      return await response.json();
    },
    onSuccess: (app) => {
      // Navigate to editor with the new app
      setLocation(`/editor/${app.id}`);
    },
    onError: (error: any) => {
      console.error('Error creating app:', error);
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || chatMutation.isPending) return;

    chatMutation.mutate(inputValue);
    setInputValue('');
  };

  const handleModeSelection = (mode: 'design' | 'build') => {
    if (mode === 'build') {
      // Create app and navigate to editor
      createAppMutation.mutate();
    } else {
      // Use standard mode selection for design mode
      modeSelectionMutation.mutate(mode);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation('/')}
              data-testid="button-back-home"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Tabs value="plan" className="w-auto">
              <TabsList>
                <TabsTrigger value="plan" data-testid="tab-plan">Plan</TabsTrigger>
                <TabsTrigger value="build" disabled data-testid="tab-build">Build</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {currentWorkspace?.name || 'Personal'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full max-w-4xl mx-auto flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-8">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="mb-8">
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4 mx-auto">
                    <span className="text-primary-foreground font-bold text-xl">R</span>
                  </div>
                  <h1 className="text-2xl font-semibold mb-2" data-testid="text-welcome-title">
                    Hi {user?.firstName || 'there'}! I'm Replie
                  </h1>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    I'm here to help you plan your next project. Tell me what you'd like to build, and I'll guide you through the planning process.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-6">
              {messages.map((message, index) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  data-testid={`message-${message.role}-${index}`}
                >
                  <div className={`flex items-start gap-3 max-w-2xl ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    {message.role === 'assistant' && (
                      <Avatar className="w-8 h-8 mt-1">
                        <AvatarFallback className="bg-primary text-primary-foreground">R</AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`px-4 py-3 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'text-foreground'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex items-start gap-3 max-w-2xl">
                    <Avatar className="w-8 h-8 mt-1">
                      <AvatarFallback className="bg-primary text-primary-foreground">R</AvatarFallback>
                    </Avatar>
                    <div className="px-4 py-3 rounded-lg text-foreground">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Mode Selection Cards */}
            {showModeSelection && !isTyping && (
              <div className="mt-8 pt-8 border-t border-border">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold mb-2" data-testid="text-mode-selection-title">
                    How would you like to proceed?
                  </h3>
                  <p className="text-muted-foreground">
                    Choose your preferred approach to bring your project to life
                  </p>
                </div>
                <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                  <Card 
                    className="cursor-pointer hover-elevate border-2 hover:border-primary/50 transition-colors"
                    onClick={() => handleModeSelection('design')}
                    data-testid="card-design-mode"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                          <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h4 className="font-semibold">Start with a design</h4>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            5-10 mins
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Create a visual prototype first to explore your ideas and refine the user experience.
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card 
                    className="cursor-pointer hover-elevate border-2 hover:border-primary/50 transition-colors"
                    onClick={() => handleModeSelection('build')}
                    data-testid="card-build-mode"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                          <Zap className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <h4 className="font-semibold">Build the entire app</h4>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            20+ mins
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Jump straight into coding with a full development environment and build functionality.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          {!showModeSelection && (
            <div className="border-t border-border px-6 py-4">
              <form onSubmit={handleSendMessage} className="flex gap-3">
                <div className="flex-1 relative">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Describe your project idea..."
                    disabled={chatMutation.isPending}
                    className="pr-12"
                    data-testid="input-chat-message"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!inputValue.trim() || chatMutation.isPending}
                    className="absolute right-1 top-1 h-8 w-8"
                    data-testid="button-send-message"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}