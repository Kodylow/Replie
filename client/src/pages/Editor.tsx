import { useState, useEffect, useRef } from 'react';
import { useLocation, useParams } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { Send, ArrowLeft, Save, Play, File, Code, Palette, Database, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { App } from '@shared/schema';

interface FileContent {
  name: string;
  content: string;
}

interface AppFile {
  name: string;
  path: string;
  size: number;
  lastModified: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export default function Editor() {
  const { appId } = useParams<{ appId: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // File management state
  const [activeFile, setActiveFile] = useState<string>('index.html');
  const [fileContents, setFileContents] = useState<Record<string, string>>({
    'index.html': '',
    'styles.css': '',
    'script.js': '',
    'db.json': ''
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);

  // Fetch app data
  const { data: app, isLoading: appLoading } = useQuery<App>({
    queryKey: ['/api/apps', appId],
    enabled: !!appId,
  });

  // Fetch app files
  const { data: filesData, isLoading: filesLoading } = useQuery<{ files: AppFile[] }>({
    queryKey: ['/api/apps', appId, 'files'],
    enabled: !!appId,
  });

  // Initialize app files
  const initializeAppMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/apps/${appId}/initialize`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/apps', appId] });
      queryClient.invalidateQueries({ queryKey: ['/api/apps', appId, 'files'] });
      toast({ title: "App initialized successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to initialize app", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  // Load file content
  const loadFileContent = async (filename: string) => {
    if (!appId) return;
    try {
      const response = await apiRequest('GET', `/api/apps/${appId}/files/${filename}`);
      const data = await response.json();
      setFileContents(prev => ({
        ...prev,
        [filename]: data.content
      }));
    } catch (error) {
      console.error('Error loading file:', error);
    }
  };

  // Save all files
  const saveFilesMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/apps/${appId}/save`, {
        files: fileContents
      });
      return await response.json();
    },
    onSuccess: () => {
      setHasUnsavedChanges(false);
      setPreviewKey(prev => prev + 1); // Force preview refresh
      toast({ title: "Files saved successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to save files", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  // Chat with AI about the current app
  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest('POST', '/api/chat/planning', {
        message: `Help me with my app: ${message}\n\nCurrent files:\n${Object.entries(fileContents).map(([name, content]) => `${name}:\n${content.slice(0, 200)}...`).join('\n\n')}`,
        workspaceId: currentWorkspace?.id,
      });
      return await response.json();
    },
    onMutate: () => {
      setIsTyping(true);
    },
    onSuccess: (data) => {
      setChatMessages(prev => [...prev, 
        { id: Date.now().toString(), role: 'user', content: chatInput, createdAt: new Date().toISOString() },
        { id: (Date.now() + 1).toString(), role: 'assistant', content: data.assistantMessage.content, createdAt: new Date().toISOString() }
      ]);
      setIsTyping(false);
    },
    onError: (error) => {
      console.error('Chat error:', error);
      setIsTyping(false);
    },
  });

  // Initialize files when app is loaded
  useEffect(() => {
    if (app && app.filesInitialized === 'false') {
      initializeAppMutation.mutate();
    }
  }, [app]);

  // Load file contents when files are available
  useEffect(() => {
    if (filesData?.files && app?.filesInitialized === 'true') {
      ['index.html', 'styles.css', 'script.js', 'db.json'].forEach(filename => {
        loadFileContent(filename);
      });
    }
  }, [filesData, app]);

  // Auto scroll chat messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleFileContentChange = (filename: string, content: string) => {
    setFileContents(prev => ({
      ...prev,
      [filename]: content
    }));
    setHasUnsavedChanges(true);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatMutation.isPending) return;

    chatMutation.mutate(chatInput);
    setChatInput('');
  };

  const getFileIcon = (filename: string) => {
    switch (filename) {
      case 'index.html': return <File className="w-4 h-4" />;
      case 'styles.css': return <Palette className="w-4 h-4" />;
      case 'script.js': return <Code className="w-4 h-4" />;
      case 'db.json': return <Database className="w-4 h-4" />;
      default: return <File className="w-4 h-4" />;
    }
  };

  if (appLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!app) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">App not found</h1>
          <Button onClick={() => setLocation('/')} data-testid="button-back-home">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go back
          </Button>
        </div>
      </div>
    );
  }

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
            <div>
              <h1 className="text-xl font-bold" data-testid="text-app-title">{app.title}</h1>
              <p className="text-sm text-muted-foreground">Editor</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {currentWorkspace?.name || 'Personal'}
            </Badge>
            <Button
              onClick={() => saveFilesMutation.mutate()}
              disabled={!hasUnsavedChanges || saveFilesMutation.isPending}
              className="gap-2"
              data-testid="button-save-files"
            >
              {saveFilesMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save
            </Button>
          </div>
        </div>
      </div>

      {/* Main Editor Layout */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Agent Chat Panel - 30% */}
          <ResizablePanel defaultSize={30} minSize={25} maxSize={40}>
            <div className="h-full flex flex-col border-r border-border">
              {/* Chat Header */}
              <div className="p-4 border-b border-border">
                <h2 className="font-semibold text-lg" data-testid="text-chat-title">AI Assistant</h2>
                <p className="text-sm text-muted-foreground">Get help with your app</p>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatMessages.length === 0 && (
                  <div className="text-center text-muted-foreground">
                    <p>Ask me anything about your app!</p>
                  </div>
                )}
                
                {chatMessages.map((message) => (
                  <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {message.role === 'assistant' && (
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          AI
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <Card className={`max-w-[80%] ${message.role === 'user' ? 'bg-primary text-primary-foreground' : ''}`}>
                      <CardContent className="p-3">
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </CardContent>
                    </Card>
                    {message.role === 'user' && (
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                          {user?.firstName?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex gap-3 justify-start">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        AI
                      </AvatarFallback>
                    </Avatar>
                    <Card>
                      <CardContent className="p-3">
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
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask about your app..."
                    disabled={chatMutation.isPending}
                    data-testid="input-chat-message"
                  />
                  <Button 
                    type="submit" 
                    size="icon"
                    disabled={!chatInput.trim() || chatMutation.isPending}
                    data-testid="button-send-message"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* File Editor and Preview Panel - 70% */}
          <ResizablePanel defaultSize={70}>
            <Tabs value={activeFile} onValueChange={setActiveFile} className="h-full flex flex-col">
              {/* File Tabs */}
              <div className="border-b border-border px-4">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="index.html" className="gap-2" data-testid="tab-index-html">
                    {getFileIcon('index.html')}
                    index.html
                  </TabsTrigger>
                  <TabsTrigger value="styles.css" className="gap-2" data-testid="tab-styles-css">
                    {getFileIcon('styles.css')}
                    styles.css
                  </TabsTrigger>
                  <TabsTrigger value="script.js" className="gap-2" data-testid="tab-script-js">
                    {getFileIcon('script.js')}
                    script.js
                  </TabsTrigger>
                  <TabsTrigger value="db.json" className="gap-2" data-testid="tab-db-json">
                    {getFileIcon('db.json')}
                    db.json
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* File Content Editor */}
              <div className="flex-1 overflow-hidden">
                <ResizablePanelGroup direction="vertical" className="h-full">
                  {/* Code Editor */}
                  <ResizablePanel defaultSize={50} minSize={30}>
                    <div className="h-full p-4">
                      <Textarea
                        value={fileContents[activeFile] || ''}
                        onChange={(e) => handleFileContentChange(activeFile, e.target.value)}
                        placeholder={`Edit ${activeFile} content...`}
                        className="h-full resize-none font-mono text-sm"
                        data-testid={`textarea-${activeFile}`}
                      />
                    </div>
                  </ResizablePanel>

                  <ResizableHandle withHandle />

                  {/* Preview Panel */}
                  <ResizablePanel defaultSize={50} minSize={30}>
                    <div className="h-full border-t border-border">
                      <div className="h-12 bg-muted border-b border-border flex items-center px-4 gap-2">
                        <Play className="w-4 h-4" />
                        <span className="font-medium">Preview</span>
                        {hasUnsavedChanges && (
                          <Badge variant="secondary" className="text-xs">Unsaved changes</Badge>
                        )}
                      </div>
                      <div className="h-[calc(100%-3rem)] bg-white">
                        <iframe
                          key={previewKey}
                          srcDoc={fileContents['index.html']}
                          className="w-full h-full border-0"
                          title="App Preview"
                          data-testid="iframe-preview"
                        />
                      </div>
                    </div>
                  </ResizablePanel>
                </ResizablePanelGroup>
              </div>
            </Tabs>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}