import { useState, useCallback, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, ApiError, isNetworkError, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuthError } from '@/hooks/useAuth';

export interface FileContents {
  [filename: string]: string;
}

interface FileLoadingState {
  [filename: string]: boolean;
}

interface FileError {
  [filename: string]: string | null;
}

/**
 * Enhanced custom hook for managing file operations in the editor
 * with comprehensive error handling, retry logic, and loading states
 */
export function useFileManagement(appId: string | undefined) {
  const { toast } = useToast();
  const { handleAuthError } = useAuthError();
  
  // State management
  const [fileContents, setFileContents] = useState<FileContents>({
    'index.html': '',
    'styles.css': '',
    'script.js': '',
    'db.json': ''
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [loadingStates, setLoadingStates] = useState<FileLoadingState>({});
  const [fileErrors, setFileErrors] = useState<FileError>({});
  
  // Track last saved content to detect changes
  const lastSavedContent = useRef<FileContents>({});

  // Helper function to handle file operation errors
  const handleFileError = (error: unknown, operation: string, filename?: string) => {
    console.error(`Error ${operation} file${filename ? ` ${filename}` : ''}:`, error);
    
    const apiError = error as ApiError;
    
    // Handle authentication/authorization errors
    if (apiError.status === 401 || apiError.status === 403) {
      handleAuthError(error, `${operation} file${filename ? ` ${filename}` : ''}`);
      return;
    }
    
    // Handle specific error cases
    let title = `Failed to ${operation} file${filename ? ` ${filename}` : ''}`;
    let description = "An unexpected error occurred. Please try again.";
    
    if (isNetworkError(error)) {
      title = "Connection failed";
      description = "Please check your internet connection and try again.";
    } else if (apiError.status === 404) {
      title = filename ? `File ${filename} not found` : "File not found";
      description = "The file you're trying to access may have been deleted.";
    } else if (apiError.status === 413) {
      title = "File too large";
      description = "The file size exceeds the maximum allowed limit.";
    } else if (apiError.status === 429) {
      title = "Too many requests";
      description = "Please wait a moment before trying again.";
    } else if (apiError.status && apiError.status >= 500) {
      title = "Server error";
      description = "Our servers are experiencing issues. Please try again later.";
    } else if (apiError.message) {
      description = apiError.message;
    }
    
    // Update file-specific error state
    if (filename) {
      setFileErrors(prev => ({
        ...prev,
        [filename]: description
      }));
    }
    
    toast({
      title,
      description,
      variant: 'destructive'
    });
  };

  // Query for app files list (to check if files exist)
  const { data: appFiles } = useQuery({
    queryKey: ['/api/apps', appId, 'files'],
    queryFn: async () => {
      if (!appId) return [];
      const response = await apiRequest('GET', `/api/apps/${appId}/files`);
      return await response.json();
    },
    enabled: !!appId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: (failureCount, error) => {
      const apiError = error as ApiError;
      if (apiError.status === 404) return false; // Don't retry if app doesn't exist
      return failureCount < 2;
    },
  });

  // Enhanced load file content with retry logic
  const loadFileContent = useCallback(async (filename: string) => {
    if (!appId) {
      toast({
        title: 'No app selected',
        description: 'Please select an app to load files.',
        variant: 'destructive'
      });
      return;
    }

    setLoadingStates(prev => ({ ...prev, [filename]: true }));
    setFileErrors(prev => ({ ...prev, [filename]: null }));

    try {
      const response = await apiRequest('GET', `/api/apps/${appId}/files/${filename}`);
      const data = await response.json();
      
      const content = data.content || '';
      setFileContents(prev => ({
        ...prev,
        [filename]: content
      }));
      
      // Update last saved content reference
      lastSavedContent.current = {
        ...lastSavedContent.current,
        [filename]: content
      };
      
    } catch (error) {
      handleFileError(error, 'load', filename);
    } finally {
      setLoadingStates(prev => ({ ...prev, [filename]: false }));
    }
  }, [appId, toast, handleAuthError]);

  // Enhanced load all files function
  const loadAllFiles = useCallback(async () => {
    if (!appId) return;
    
    const defaultFiles = ['index.html', 'styles.css', 'script.js', 'db.json'];
    await Promise.all(defaultFiles.map(filename => loadFileContent(filename)));
  }, [appId, loadFileContent]);

  // Update file content with change detection
  const updateFileContent = useCallback((filename: string, content: string) => {
    setFileContents(prev => ({
      ...prev,
      [filename]: content
    }));
    
    // Check if content has actually changed from last saved
    const lastSaved = lastSavedContent.current[filename] || '';
    setHasUnsavedChanges(content !== lastSaved);
    
    // Clear any previous errors for this file
    setFileErrors(prev => ({ ...prev, [filename]: null }));
  }, []);

  // Enhanced save files mutation with retry logic
  const saveFilesMutation = useMutation({
    mutationFn: async () => {
      if (!appId) {
        throw new Error('No app selected. Please select an app to save files.');
      }
      
      const response = await apiRequest('POST', `/api/apps/${appId}/save`, {
        files: fileContents
      });
      return await response.json();
    },
    onSuccess: () => {
      setHasUnsavedChanges(false);
      setPreviewKey(prev => prev + 1); // Force preview refresh
      
      // Update last saved content reference
      lastSavedContent.current = { ...fileContents };
      
      // Clear all file errors
      setFileErrors({});
      
      // Invalidate related queries
      queryClient.invalidateQueries({ 
        queryKey: ['/api/apps', appId, 'files'] 
      });
      
      toast({ 
        title: "Files saved successfully",
        description: "All your changes have been saved."
      });
    },
    onError: (error) => handleFileError(error, 'save'),
    retry: (failureCount, error) => {
      if (failureCount >= 2) return false;
      
      const apiError = error as ApiError;
      // Don't retry client errors except rate limiting
      if (apiError.status && apiError.status >= 400 && apiError.status < 500 && apiError.status !== 429) {
        return false;
      }
      
      return isNetworkError(error) || (apiError.status && apiError.status >= 500);
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 8000),
  });

  // Auto-save functionality (optional)
  const autoSave = useCallback(async () => {
    if (hasUnsavedChanges && !saveFilesMutation.isPending) {
      try {
        await saveFilesMutation.mutateAsync();
      } catch (error) {
        // Auto-save errors are handled by the mutation
      }
    }
  }, [hasUnsavedChanges, saveFilesMutation]);

  return {
    fileContents,
    hasUnsavedChanges,
    previewKey,
    loadingStates,
    fileErrors,
    appFiles: appFiles?.files || [],
    loadFileContent,
    loadAllFiles,
    updateFileContent,
    saveFiles: saveFilesMutation.mutate,
    saveFilesAsync: saveFilesMutation.mutateAsync,
    autoSave,
    isSaving: saveFilesMutation.isPending,
    saveError: saveFilesMutation.error,
    // Helper functions
    clearFileError: (filename: string) => {
      setFileErrors(prev => ({ ...prev, [filename]: null }));
    },
    resetChanges: () => {
      setFileContents({ ...lastSavedContent.current });
      setHasUnsavedChanges(false);
    },
    isFileLoading: (filename: string) => loadingStates[filename] || false,
    getFileError: (filename: string) => fileErrors[filename] || null,
  };
}