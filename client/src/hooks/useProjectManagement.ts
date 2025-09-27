import { useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest, ApiError, isNetworkError } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useAuthError } from '@/hooks/useAuth';
import type { InsertProject } from '@shared/schema';

/**
 * Enhanced custom hook for managing project operations (create, update, delete)
 * with comprehensive error handling and retry logic
 */
export function useProjectManagement() {
  const { toast } = useToast();
  const { currentWorkspace } = useWorkspace();
  const { handleAuthError } = useAuthError();

  // Helper function to handle project operation errors
  const handleProjectError = (error: unknown, operation: string) => {
    console.error(`Error ${operation} project:`, error);
    
    const apiError = error as ApiError;
    
    // Handle authentication/authorization errors
    if (apiError.status === 401 || apiError.status === 403) {
      handleAuthError(error, `${operation} project`);
      return;
    }
    
    // Handle specific error cases
    let title = `Failed to ${operation} project`;
    let description = "An unexpected error occurred. Please try again.";
    
    if (isNetworkError(error)) {
      title = "Connection failed";
      description = "Please check your internet connection and try again.";
    } else if (apiError.status === 404) {
      title = "Project not found";
      description = "The project you're trying to access may have been deleted.";
    } else if (apiError.status === 409) {
      title = "Conflict error";
      description = "A project with this name already exists.";
    } else if (apiError.status === 429) {
      title = "Too many requests";
      description = "Please wait a moment before trying again.";
    } else if (apiError.status && apiError.status >= 500) {
      title = "Server error";
      description = "Our servers are experiencing issues. Please try again later.";
    } else if (apiError.message) {
      description = apiError.message;
    }
    
    toast({
      title,
      description,
      variant: 'destructive'
    });
  };

  // Create project mutation with enhanced error handling
  const createProjectMutation = useMutation({
    mutationFn: async (projectData: Omit<InsertProject, 'workspaceId'>) => {
      if (!currentWorkspace) {
        throw new Error('No workspace selected. Please select a workspace first.');
      }
      
      const response = await apiRequest(
        'POST', 
        `/api/workspaces/${currentWorkspace.id}/projects`,
        projectData
      );
      return await response.json();
    },
    onSuccess: (newProject) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ 
        queryKey: ['/api/workspaces', currentWorkspace?.id, 'projects'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/workspaces'], 
        exact: false 
      });
      
      toast({
        title: 'Project created!',
        description: `${newProject.title} has been created successfully.`
      });
    },
    onError: (error) => handleProjectError(error, 'create'),
    retry: (failureCount, error) => {
      // Retry for network errors and server errors
      if (failureCount >= 2) return false;
      
      const apiError = error as ApiError;
      if (apiError.status && apiError.status >= 400 && apiError.status < 500) {
        return false; // Don't retry client errors
      }
      
      return isNetworkError(error) || (apiError.status && apiError.status >= 500);
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });

  // Update project mutation with enhanced error handling
  const updateProjectMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertProject> }) => {
      if (!currentWorkspace) {
        throw new Error('No workspace selected. Please select a workspace first.');
      }
      
      const response = await apiRequest(
        'PATCH', 
        `/api/projects/${id}`,
        data
      );
      return await response.json();
    },
    onSuccess: (updatedProject) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ 
        queryKey: ['/api/workspaces', currentWorkspace?.id, 'projects'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/projects', updatedProject.id] 
      });
      
      toast({
        title: 'Project updated!',
        description: `${updatedProject.title} has been updated successfully.`
      });
    },
    onError: (error) => handleProjectError(error, 'update'),
    retry: (failureCount, error) => {
      if (failureCount >= 2) return false;
      
      const apiError = error as ApiError;
      if (apiError.status && apiError.status >= 400 && apiError.status < 500) {
        return false;
      }
      
      return isNetworkError(error) || (apiError.status && apiError.status >= 500);
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });

  // Delete project mutation with enhanced error handling
  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      if (!currentWorkspace) {
        throw new Error('No workspace selected. Please select a workspace first.');
      }
      
      await apiRequest('DELETE', `/api/projects/${projectId}`);
      return projectId;
    },
    onSuccess: (deletedProjectId) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ 
        queryKey: ['/api/workspaces', currentWorkspace?.id, 'projects'] 
      });
      queryClient.removeQueries({ 
        queryKey: ['/api/projects', deletedProjectId] 
      });
      
      toast({
        title: 'Project deleted!',
        description: 'The project has been deleted successfully.'
      });
    },
    onError: (error) => handleProjectError(error, 'delete'),
    retry: (failureCount, error) => {
      if (failureCount >= 1) return false; // Only retry once for delete
      
      const apiError = error as ApiError;
      if (apiError.status && apiError.status >= 400 && apiError.status < 500) {
        return false;
      }
      
      return isNetworkError(error) || (apiError.status && apiError.status >= 500);
    },
    retryDelay: 2000,
  });

  return {
    createProject: createProjectMutation,
    updateProject: updateProjectMutation,
    deleteProject: deleteProjectMutation,
    isCreating: createProjectMutation.isPending,
    isUpdating: updateProjectMutation.isPending,
    isDeleting: deleteProjectMutation.isPending,
    // Expose error states for components that need them
    createError: createProjectMutation.error,
    updateError: updateProjectMutation.error,
    deleteError: deleteProjectMutation.error,
  };
}