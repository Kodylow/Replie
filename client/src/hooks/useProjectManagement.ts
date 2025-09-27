import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import type { InsertProject } from '@shared/schema';

/**
 * Custom hook for managing project operations (create, update, delete)
 */
export function useProjectManagement() {
  const { toast } = useToast();
  const { currentWorkspace } = useWorkspace();

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (projectData: Omit<InsertProject, 'workspaceId'>) => {
      if (!currentWorkspace) throw new Error('No workspace selected');
      const response = await fetch(`/api/workspaces/${currentWorkspace.id}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData)
      });
      if (!response.ok) throw new Error('Failed to create project');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workspaces', currentWorkspace?.id, 'projects'] });
      toast({
        title: 'Project created!',
        description: 'Your new project has been created successfully.'
      });
    },
    onError: (error) => {
      console.error('Error creating project:', error);
      toast({
        title: 'Error',
        description: 'Failed to create project. Please try again.',
        variant: 'destructive'
      });
    }
  });

  // Update project mutation
  const updateProjectMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertProject> }) => {
      if (!currentWorkspace) throw new Error('No workspace selected');
      const response = await fetch(`/api/workspaces/${currentWorkspace.id}/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update project');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workspaces', currentWorkspace?.id, 'projects'] });
      toast({
        title: 'Project updated!',
        description: 'Your project has been updated successfully.'
      });
    },
    onError: (error) => {
      console.error('Error updating project:', error);
      toast({
        title: 'Error',
        description: 'Failed to update project. Please try again.',
        variant: 'destructive'
      });
    }
  });

  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      if (!currentWorkspace) throw new Error('No workspace selected');
      const response = await fetch(`/api/workspaces/${currentWorkspace.id}/projects/${projectId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete project');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workspaces', currentWorkspace?.id, 'projects'] });
      toast({
        title: 'Project deleted!',
        description: 'Your project has been deleted successfully.'
      });
    },
    onError: (error) => {
      console.error('Error deleting project:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete project. Please try again.',
        variant: 'destructive'
      });
    }
  });

  return {
    createProject: createProjectMutation,
    updateProject: updateProjectMutation,
    deleteProject: deleteProjectMutation,
    isCreating: createProjectMutation.isPending,
    isUpdating: updateProjectMutation.isPending,
    isDeleting: deleteProjectMutation.isPending,
  };
}