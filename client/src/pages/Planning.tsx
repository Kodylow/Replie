import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { ArrowLeft, Clock, Code, Palette } from 'lucide-react';
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
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const [userMessage, setUserMessage] = useState('');
  const [replieResponse, setReplieResponse] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [showModeSelection, setShowModeSelection] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [hasStartedChat, setHasStartedChat] = useState(false);

  // Extract project idea from URL parameters and start real AI planning
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const ideaParam = urlParams.get('idea');
    if (ideaParam) {
      const decodedIdea = decodeURIComponent(ideaParam);
      console.log('🚀 Planning: Starting AI planning for:', decodedIdea);
      setUserMessage(decodedIdea);
      setHasStartedChat(true);
      setIsTyping(true);
      
      // Start real AI planning
      if (currentWorkspace?.id) {
        console.log('✅ Planning: Workspace available, starting AI chat mutation');
        chatMutation.mutate(decodedIdea);
      } else {
        console.log('⚠️ Planning: No workspace available, waiting...');
        // Wait for workspace to be available
        const checkWorkspace = setInterval(() => {
          if (currentWorkspace?.id) {
            console.log('✅ Planning: Workspace now available, starting AI chat mutation');
            clearInterval(checkWorkspace);
            chatMutation.mutate(decodedIdea);
          }
        }, 100);
        
        // Cleanup interval after 5 seconds
        setTimeout(() => {
          clearInterval(checkWorkspace);
          if (!replieResponse) {
            console.log('❌ Planning: Timeout waiting for workspace');
            setIsTyping(false);
          }
        }, 5000);
      }
    }
  }, [location, currentWorkspace?.id]);

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      console.log('🤖 Planning: Sending AI request for message:', message);
      console.log('📝 Planning: Workspace ID:', currentWorkspace?.id);
      console.log('💬 Planning: Conversation ID:', conversationId);
      
      const requestBody: any = {
        message,
        workspaceId: currentWorkspace?.id,
      };
      
      // Only include conversationId if it has a value
      if (conversationId) {
        requestBody.conversationId = conversationId;
      }
      
      const response = await apiRequest('POST', '/api/chat/planning', requestBody);
      
      console.log('📨 Planning: API response status:', response.status);
      const data = await response.json() as ChatResponse;
      console.log('✨ Planning: AI response received:', data.assistantMessage?.content?.substring(0, 100) + '...');
      console.log('🎯 Planning: Show mode selection:', data.showModeSelection);
      
      return data;
    },
    onMutate: () => {
      console.log('⏳ Planning: Starting AI mutation, setting typing state');
      setIsTyping(true);
    },
    onSuccess: (data) => {
      console.log('✅ Planning: AI response success');
      setConversationId(data.conversation.id);
      setReplieResponse(data.assistantMessage.content);
      setShowModeSelection(data.showModeSelection);
      setIsTyping(false);
      console.log('🎉 Planning: UI state updated with AI response');
    },
    onError: (error) => {
      console.error('❌ Planning: AI request failed:', error);
      setIsTyping(false);
      // Don't show fallback content - let the user see the error
    },
  });

  const createAppMutation = useMutation({
    mutationFn: async () => {
      if (!currentWorkspace?.id) throw new Error('No workspace selected');
      
      const response = await apiRequest('POST', `/api/workspaces/${currentWorkspace.id}/apps`, {
        title: userMessage.slice(0, 50) || 'My App',
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

  const handleModeSelection = (mode: 'design' | 'build') => {
    if (mode === 'build') {
      // Create app and navigate to editor
      createAppMutation.mutate();
    } else {
      // Handle design mode - could navigate to a design interface
      setLocation('/');
    }
  };


  return (
    <div className="h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation('/')}
            data-testid="button-back-home"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <span className="text-lg font-medium">HelloWorld (B)</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center px-6 py-8 overflow-auto">

        {/* After chat started - show user message */}
        {userMessage && (
          <div className="w-full max-w-2xl space-y-6">
            {/* User Message */}
            <div className="flex justify-end">
              <div className="bg-blue-500 text-white px-4 py-2 rounded-lg max-w-xs">
                {userMessage}
                <div className="text-xs text-blue-100 mt-1">Just now</div>
              </div>
            </div>

            {/* Replie Response */}
            {(replieResponse || isTyping) && (
              <div className="space-y-4">
                <div className="bg-gray-50 p-6 rounded-lg">
                  {isTyping ? (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="prose prose-sm max-w-none">
                        {replieResponse}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="border-gray-300"
                        data-testid="button-change-plan"
                      >
                        Change plan
                      </Button>
                    </div>
                  )}
                </div>

                {/* Mode Selection Cards - only show after response is complete */}
                {showModeSelection && !isTyping && (
                  <div className="space-y-6 pt-8">
                    <div className="text-center">
                      <h3 className="text-lg font-medium mb-2">How do you want to continue?</h3>
                    </div>
                    
                    <div className="space-y-4">
                      {/* Build the entire app */}
                      <Card 
                        className="cursor-pointer hover:bg-gray-50 transition-colors border-2"
                        onClick={() => handleModeSelection('build')}
                        data-testid="card-build-mode"
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                              <Code className="w-5 h-5 text-gray-600" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold">Build the entire app</h4>
                                <div className="flex items-center gap-1 text-sm text-gray-500">
                                  <Clock className="w-3 h-3" />
                                  20+ mins
                                </div>
                              </div>
                              <p className="text-sm text-gray-600">
                                Best if you want Agent to build out the full functionality of your app
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Start with a design */}
                      <Card 
                        className="cursor-pointer hover:bg-gray-50 transition-colors border-2"
                        onClick={() => handleModeSelection('design')}
                        data-testid="card-design-mode"
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                              <Palette className="w-5 h-5 text-gray-600" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold">Start with a design</h4>
                                <div className="flex items-center gap-1 text-sm text-gray-500">
                                  <Clock className="w-3 h-3" />
                                  5-10 mins
                                </div>
                              </div>
                              <p className="text-sm text-gray-600">
                                Best if you want to see a design prototype first, then iterate on visuals or features
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Start building button */}
                      <div className="pt-4">
                        <Button 
                          className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                          onClick={() => handleModeSelection('build')}
                          data-testid="button-start-building"
                        >
                          Start building →
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}