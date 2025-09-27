import { useState, useEffect, useRef } from 'react';
import { useLocation, useParams } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { ArrowLeft, Save, Loader2, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFileManagement } from '@/hooks/useFileManagement';
import { AIChatPanel } from '@/components/editor/AIChatPanel';
import { FileEditor } from '@/components/editor/FileEditor';
import type { App } from '@shared/schema';

interface AppFile {
  name: string;
  path: string;
  size: number;
  lastModified: string;
}

export default function Editor() {
  const { appId } = useParams<{ appId: string }>();
  const [, setLocation] = useLocation();
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // File management state
  const [activeFile, setActiveFile] = useState<string>('index.html');
  const [previewKey, setPreviewKey] = useState(0);
  const filesLoadedRef = useRef(false);
  
  const {
    fileContents,
    hasUnsavedChanges,
    loadFileContent,
    updateFileContent,
    saveFiles,
    saveFilesWithAgent,
    saveFilesWithAgentAsync,
    isSaving,
  } = useFileManagement(appId);

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

  // Save files mutation
  const saveFilesMutation = useMutation({
    mutationFn: async () => {
      if (!appId) throw new Error('No app ID provided');
      const response = await apiRequest('POST', `/api/apps/${appId}/save`, {
        files: fileContents
      });
      return await response.json();
    },
    onSuccess: () => {
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

  // Initialize files when app is loaded
  useEffect(() => {
    if (app && app.filesInitialized === 'false') {
      initializeAppMutation.mutate();
    }
  }, [app]);

  // Load file contents when files are available (only once)
  useEffect(() => {
    if (filesData?.files && app?.filesInitialized === 'true' && !filesLoadedRef.current) {
      filesLoadedRef.current = true;
      ['index.html', 'styles.css', 'script.js', 'db.json'].forEach(filename => {
        loadFileContent(filename);
      });
    }
  }, [filesData, app]);

  const handleFileContentChange = (filename: string, content: string) => {
    updateFileContent(filename, content);
  };

  const handleSaveFiles = () => {
    saveFilesMutation.mutate();
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
              onClick={handleSaveFiles}
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
          {/* AI Chat Panel - 30% */}
          <ResizablePanel defaultSize={30} minSize={25} maxSize={40}>
            <AIChatPanel 
              fileContents={fileContents} 
              updateFileContent={updateFileContent}
              saveFilesWithAgent={saveFilesWithAgentAsync}
              appId={appId}
            />
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* File Editor and Preview Panel - 70% */}
          <ResizablePanel defaultSize={70}>
            <ResizablePanelGroup direction="vertical" className="h-full">
              {/* File Editor - 50% */}
              <ResizablePanel defaultSize={50} minSize={30}>
                <FileEditor 
                  fileContents={fileContents}
                  activeFile={activeFile}
                  onActiveFileChange={setActiveFile}
                  onFileContentChange={handleFileContentChange}
                />
              </ResizablePanel>

              <ResizableHandle withHandle />

              {/* Preview Panel - 50% */}
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
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}