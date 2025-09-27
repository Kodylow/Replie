import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export interface FileContents {
  [filename: string]: string;
}

/**
 * Custom hook for managing file operations in the editor
 */
export function useFileManagement(appId: string | undefined) {
  const { toast } = useToast();
  const [fileContents, setFileContents] = useState<FileContents>({
    'index.html': '',
    'styles.css': '',
    'script.js': '',
    'db.json': ''
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);

  // Load file content
  const loadFileContent = useCallback(async (filename: string) => {
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
      toast({
        title: 'Failed to load file',
        description: `Could not load ${filename}`,
        variant: 'destructive'
      });
    }
  }, [appId, toast]);

  // Update file content
  const updateFileContent = useCallback((filename: string, content: string) => {
    setFileContents(prev => ({
      ...prev,
      [filename]: content
    }));
    setHasUnsavedChanges(true);
  }, []);

  // Save all files mutation
  const saveFilesMutation = useMutation({
    mutationFn: async () => {
      if (!appId) throw new Error('No app ID provided');
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

  return {
    fileContents,
    hasUnsavedChanges,
    previewKey,
    loadFileContent,
    updateFileContent,
    saveFiles: saveFilesMutation.mutate,
    isSaving: saveFilesMutation.isPending,
  };
}