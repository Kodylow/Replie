import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Workspace } from '@shared/schema';
import { useAuth } from '@/hooks/useAuth';

interface WorkspaceContextType {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  setCurrentWorkspace: (workspace: Workspace) => void;
  isLoading: boolean;
  refetchWorkspaces: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

async function fetchWorkspaces(): Promise<Workspace[]> {
  const response = await fetch('/api/workspaces', {
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch workspaces: ${response.statusText}`);
  }
  
  return response.json();
}

interface WorkspaceProviderProps {
  children: ReactNode;
}

export function WorkspaceProvider({ children }: WorkspaceProviderProps) {
  const { isAuthenticated } = useAuth();
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);

  const { 
    data: workspaces = [], 
    isLoading, 
    refetch: refetchWorkspaces 
  } = useQuery<Workspace[]>({
    queryKey: ['/api/workspaces'],
    queryFn: fetchWorkspaces,
    enabled: isAuthenticated,
    retry: false,
  });

  // Set default workspace when workspaces load and validate current workspace
  useEffect(() => {
    if (workspaces.length > 0) {
      // Check if current workspace still exists in the fetched list
      const isCurrentWorkspaceValid = currentWorkspace && 
        workspaces.some(w => w.id === currentWorkspace.id);
      
      if (!isCurrentWorkspaceValid) {
        // Current workspace is invalid or doesn't exist
        // Try to get workspace from localStorage first
        const savedWorkspaceId = localStorage.getItem('currentWorkspaceId');
        const savedWorkspace = savedWorkspaceId 
          ? workspaces.find(w => w.id === savedWorkspaceId)
          : null;
        
        // Use saved workspace if found and valid, otherwise use first workspace
        const defaultWorkspace = savedWorkspace || workspaces[0];
        setCurrentWorkspace(defaultWorkspace);
      }
    } else {
      // No workspaces available, clear current workspace
      setCurrentWorkspace(null);
    }
  }, [workspaces]);

  // Save current workspace to localStorage when it changes
  useEffect(() => {
    if (currentWorkspace) {
      localStorage.setItem('currentWorkspaceId', currentWorkspace.id);
    }
  }, [currentWorkspace]);

  // Clear current workspace when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      setCurrentWorkspace(null);
      localStorage.removeItem('currentWorkspaceId');
    }
  }, [isAuthenticated]);

  return (
    <WorkspaceContext.Provider 
      value={{
        workspaces,
        currentWorkspace,
        setCurrentWorkspace,
        isLoading,
        refetchWorkspaces,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}