import { useState } from 'react'
import { useLocation } from 'wouter'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Search, Plus, MoreHorizontal, ExternalLink, Settings, Trash2, Download, AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth, useAuthError } from '@/hooks/useAuth'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { queryClient, getQueryFn, apiRequest, ApiError, isNetworkError } from '@/lib/queryClient'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { QueryErrorBoundary } from '@/components/ui/query-error-boundary'
import { LoadingWrapper, TableLoading, EmptyState } from '@/components/ui/loading-states'
import { ButtonLoading } from '@/components/ui/loading-spinner'
import type { App, InsertApp } from '@shared/schema'

const appIcons = [
  'E', 'V', 'C', 'R', 'S', 'O', 'P', 'T', 'M', 'B', 'L', 'A', 'N', 'H', 'K', 'D'
]

const backgroundColors = [
  'bg-gradient-to-br from-orange-400 to-red-500',
  'bg-gradient-to-br from-gray-700 to-gray-900',
  'bg-gradient-to-br from-blue-500 to-purple-600',
  'bg-gradient-to-br from-green-400 to-blue-500',
  'bg-gradient-to-br from-purple-400 to-pink-500',
  'bg-gradient-to-br from-yellow-400 to-orange-500',
]

function getRandomBackgroundColor(): string {
  return backgroundColors[Math.floor(Math.random() * backgroundColors.length)]
}

function getAppIcon(title: string) {
  const index = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % appIcons.length
  return appIcons[index]
}

function getCreatorInitials(creator: string) {
  return creator.split('').slice(0, 2).join('').toUpperCase()
}

function formatTimeAgo(date: Date) {
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
  
  if (diffInMinutes < 60) {
    return diffInMinutes <= 1 ? '1 minute ago' : `${diffInMinutes} minutes ago`
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return diffInHours === 1 ? '1 hour ago' : `${diffInHours} hours ago`
  }
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 30) {
    return diffInDays === 1 ? '1 day ago' : `${diffInDays} days ago`
  }
  
  return date.toLocaleDateString()
}

interface AppsProps {
  searchResults: any[]
  isSearching: boolean
}

function AppsContent({ searchResults = [], isSearching }: AppsProps) {
  const [, setLocation] = useLocation()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterMode, setFilterMode] = useState<'all' | 'creator' | 'me' | 'published'>('all')
  const [editingApp, setEditingApp] = useState<App | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deletingApp, setDeletingApp] = useState<App | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newAppTitle, setNewAppTitle] = useState('')
  const [newAppWorkspaceId, setNewAppWorkspaceId] = useState('')
  const [newAppVisibility, setNewAppVisibility] = useState<'private' | 'public'>('private')
  const { toast } = useToast()
  const { user } = useAuth()
  const { handleAuthError } = useAuthError()
  const { workspaces, currentWorkspace } = useWorkspace()

  // Fetch all apps for current workspace with enhanced error handling
  const { 
    data: apps = [], 
    isLoading, 
    error, 
    refetch 
  } = useQuery<App[]>({
    queryKey: ['/api/workspaces', currentWorkspace?.id, 'apps'],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!currentWorkspace,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Don't retry if workspace doesn't exist
      const apiError = error as ApiError;
      if (apiError.status === 404) return false;
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  })

  // Filter apps locally (ignore shared search for now since it's project-focused)
  const filteredApps = apps.filter(app => {
    const matchesSearch = app.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.creator.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesFilter = (() => {
      switch (filterMode) {
        case 'published':
          return app.isPublished === 'true'
        case 'creator':
        case 'me':
        case 'all':
        default:
          return true
      }
    })()
    
    return matchesSearch && matchesFilter
  })

  // Helper function to handle app operation errors
  const handleAppError = (error: unknown, operation: string, appTitle?: string) => {
    console.error(`Error ${operation} app${appTitle ? ` ${appTitle}` : ''}:`, error);
    
    const apiError = error as ApiError;
    
    // Handle authentication/authorization errors
    if (apiError.status === 401 || apiError.status === 403) {
      handleAuthError(error, `${operation} app${appTitle ? ` ${appTitle}` : ''}`);
      return;
    }
    
    // Handle specific error cases
    let title = `Failed to ${operation} app${appTitle ? ` ${appTitle}` : ''}`;
    let description = "An unexpected error occurred. Please try again.";
    
    if (isNetworkError(error)) {
      title = "Connection failed";
      description = "Please check your internet connection and try again.";
    } else if (apiError.status === 404) {
      title = appTitle ? `App ${appTitle} not found` : "App not found";
      description = "The app you're trying to access may have been deleted.";
    } else if (apiError.status === 409) {
      title = "Conflict error";
      description = "An app with this name already exists in this workspace.";
    } else if (apiError.status === 413) {
      title = "App too large";
      description = "The app content exceeds the maximum allowed size.";
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

  // Enhanced create app mutation
  const createAppMutation = useMutation({
    mutationFn: async (appData: InsertApp & { workspaceId: string }) => {
      if (!appData.workspaceId) {
        throw new Error('No workspace selected. Please select a workspace first.');
      }
      
      const { workspaceId, ...appDataWithoutWorkspaceId } = appData;
      const response = await apiRequest(
        'POST', 
        `/api/workspaces/${workspaceId}/apps`,
        appDataWithoutWorkspaceId
      );
      return await response.json();
    },
    onSuccess: (newApp) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ 
        queryKey: ['/api/workspaces', newAppWorkspaceId, 'apps'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/workspaces'], 
        exact: false 
      });
      
      // Reset form state
      setCreateDialogOpen(false);
      setNewAppTitle('');
      setNewAppWorkspaceId('');
      setNewAppVisibility('private');
      
      toast({
        title: 'App created!',
        description: `${newApp.title} has been created successfully.`
      });
    },
    onError: (error) => handleAppError(error, 'create'),
    retry: (failureCount, error) => {
      if (failureCount >= 2) return false;
      
      const apiError = error as ApiError;
      // Don't retry client errors
      if (apiError.status && apiError.status >= 400 && apiError.status < 500) {
        return false;
      }
      
      return Boolean(isNetworkError(error) || (apiError.status && apiError.status >= 500));
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  })

  // Enhanced update app mutation
  const updateAppMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: Partial<InsertApp> }) => {
      const response = await apiRequest('PATCH', `/api/apps/${id}`, updates);
      return await response.json();
    },
    onSuccess: (updatedApp) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ 
        queryKey: ['/api/workspaces', currentWorkspace?.id, 'apps'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/apps', updatedApp.id] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/workspaces'], 
        exact: false 
      });
      
      // Reset edit state
      setEditDialogOpen(false);
      setEditingApp(null);
      
      toast({
        title: 'App updated!',
        description: `${updatedApp.title} has been updated successfully.`
      });
    },
    onError: (error) => handleAppError(error, 'update', editingApp?.title),
    retry: (failureCount, error) => {
      if (failureCount >= 2) return false;
      
      const apiError = error as ApiError;
      if (apiError.status && apiError.status >= 400 && apiError.status < 500) {
        return false;
      }
      
      return Boolean(isNetworkError(error) || (apiError.status && apiError.status >= 500));
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  })

  // Enhanced delete app mutation
  const deleteAppMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/apps/${id}`);
      return id;
    },
    onSuccess: (deletedAppId) => {
      const deletedAppTitle = deletingApp?.title || 'the app';
      
      // Invalidate and remove relevant queries
      queryClient.invalidateQueries({ 
        queryKey: ['/api/workspaces', currentWorkspace?.id, 'apps'] 
      });
      queryClient.removeQueries({ 
        queryKey: ['/api/apps', deletedAppId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/workspaces'], 
        exact: false 
      });
      
      // Reset delete state
      setDeletingApp(null);
      
      toast({
        title: 'App deleted!',
        description: `${deletedAppTitle} has been deleted successfully.`
      });
    },
    onError: (error) => handleAppError(error, 'delete', deletingApp?.title),
    retry: (failureCount, error) => {
      if (failureCount >= 1) return false; // Only retry once for delete
      
      const apiError = error as ApiError;
      if (apiError.status && apiError.status >= 400 && apiError.status < 500) {
        return false;
      }
      
      return Boolean(isNetworkError(error) || (apiError.status && apiError.status >= 500));
    },
    retryDelay: 2000,
  })

  const handleEditApp = (app: App) => {
    setEditingApp(app)
    setEditDialogOpen(true)
  }

  const handleDeleteApp = (app: App) => {
    setDeletingApp(app)
  }

  const handleCreateApp = () => {
    // Set default workspace to current workspace
    if (currentWorkspace) {
      setNewAppWorkspaceId(currentWorkspace.id)
    }
    setCreateDialogOpen(true)
  }

  const handleSaveNewApp = () => {
    if (newAppTitle.trim() && newAppWorkspaceId && user) {
      const appData: InsertApp = {
        title: newAppTitle.trim(),
        creator: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.email || 'Unknown User',
        workspaceId: newAppWorkspaceId,
        isPublished: 'false',
        isPrivate: newAppVisibility === 'private' ? 'true' : 'false',
        backgroundColor: getRandomBackgroundColor()
      }
      createAppMutation.mutate(appData)
    }
  }

  const handleSaveApp = (updates: Partial<InsertApp>) => {
    if (editingApp) {
      updateAppMutation.mutate({ id: editingApp.id, updates })
    }
  }

  const confirmDelete = () => {
    if (deletingApp) {
      deleteAppMutation.mutate(deletingApp.id)
    }
  }

  // Enhanced loading and error states
  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        {/* Header skeleton */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-6 w-16 bg-muted animate-pulse rounded"></div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-10 w-80 bg-muted animate-pulse rounded"></div>
              <div className="h-8 w-32 bg-muted animate-pulse rounded"></div>
              <div className="flex gap-1">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-8 w-20 bg-muted animate-pulse rounded"></div>
                ))}
              </div>
            </div>
          </div>
          <div className="h-10 w-24 bg-muted animate-pulse rounded"></div>
        </div>
        
        {/* Table loading */}
        <div className="flex-1 overflow-auto">
          <TableLoading columns={6} rows={8} />
        </div>
      </div>
    )
  }

  if (error && !apps.length) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Failed to load apps</h3>
          <p className="text-muted-foreground mb-4">
            {isNetworkError(error) 
              ? "Please check your internet connection and try again."
              : "Something went wrong while loading your apps. Please try again."}
          </p>
          <Button onClick={() => refetch()} variant="outline" data-testid="button-retry-apps">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-xl font-semibold text-foreground">Apps</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search Apps..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-apps"
              />
            </div>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Download CSV
            </Button>
            <div className="flex items-center gap-1">
              <Button 
                variant={filterMode === 'creator' ? 'default' : 'ghost'} 
                size="sm"
                onClick={() => setFilterMode('creator')}
              >
                Creator
              </Button>
              <Button 
                variant={filterMode === 'me' ? 'default' : 'ghost'} 
                size="sm"
                onClick={() => setFilterMode('me')}
              >
                Created by me
              </Button>
              <Button 
                variant={filterMode === 'all' ? 'default' : 'ghost'} 
                size="sm"
                onClick={() => setFilterMode('all')}
              >
                All
              </Button>
              <Button 
                variant={filterMode === 'published' ? 'default' : 'ghost'} 
                size="sm"
                onClick={() => setFilterMode('published')}
              >
                <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                Published
              </Button>
            </div>
          </div>
        </div>
        <Button onClick={handleCreateApp} data-testid="button-create-app">
          <Plus className="w-4 h-4 mr-2" />
          Create
        </Button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border">
              <TableHead className="w-[30%]">Title</TableHead>
              <TableHead className="w-[20%]">Creator</TableHead>
              <TableHead className="w-[15%]">Published App</TableHead>
              <TableHead className="w-[15%]">Last update</TableHead>
              <TableHead className="w-[15%]">Created</TableHead>
              <TableHead className="w-[5%]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredApps.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <EmptyState
                    title={(searchQuery || isSearching) ? "No apps found" : "No apps yet"}
                    description={(searchQuery || isSearching) 
                      ? "Try adjusting your search or filter criteria."
                      : "Create your first app to get started with building something amazing."}
                    action={!(searchQuery || isSearching) ? (
                      <Button onClick={handleCreateApp} data-testid="button-create-first-app">
                        <Plus className="w-4 h-4 mr-2" />
                        Create First App
                      </Button>
                    ) : undefined}
                  />
                </TableCell>
              </TableRow>
            ) : (
              filteredApps.map((app) => (
                <TableRow key={app.id} className="border-b border-border hover:bg-muted/50" data-testid={`row-app-${app.id}`}>
                  <TableCell className="flex items-center gap-3 py-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-muted text-muted-foreground text-sm font-medium">
                        {getAppIcon(app.title)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-foreground" data-testid={`text-app-name-${app.id}`}>
                      {app.title}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                          {getCreatorInitials(app.creator)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-muted-foreground text-sm">{app.creator}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {app.isPublished === 'true' ? (
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                          <div className="w-2 h-2 rounded-full bg-green-500 mr-1"></div>
                          Published
                        </Badge>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">–</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatTimeAgo(new Date(app.updatedAt))}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatTimeAgo(new Date(app.createdAt))}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" data-testid={`button-menu-${app.id}`}>
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditApp(app)} data-testid={`menu-edit-${app.id}`}>
                          <Settings className="w-4 h-4 mr-2" />
                          Settings
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setLocation(`/editor/${app.id}`)}
                          data-testid={`menu-open-${app.id}`}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Open
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteApp(app)}
                          className="text-destructive focus:text-destructive"
                          data-testid={`menu-delete-${app.id}`}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create App Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New App</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="app-title">App Title</Label>
              <Input
                id="app-title"
                placeholder="Enter app title"
                value={newAppTitle}
                onChange={(e) => setNewAppTitle(e.target.value)}
                data-testid="input-new-app-title"
              />
            </div>
            <div>
              <Label htmlFor="app-workspace">Workspace</Label>
              <Select value={newAppWorkspaceId} onValueChange={setNewAppWorkspaceId}>
                <SelectTrigger data-testid="select-workspace">
                  <SelectValue placeholder="Select workspace" />
                </SelectTrigger>
                <SelectContent>
                  {workspaces.map((workspace) => (
                    <SelectItem key={workspace.id} value={workspace.id}>
                      {workspace.name} ({workspace.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="app-visibility">Visibility</Label>
              <Select value={newAppVisibility} onValueChange={(value: 'private' | 'public') => setNewAppVisibility(value)}>
                <SelectTrigger data-testid="select-visibility">
                  <SelectValue placeholder="Select visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setCreateDialogOpen(false)}
                data-testid="button-cancel-create"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveNewApp}
                disabled={!newAppTitle.trim() || !newAppWorkspaceId || createAppMutation.isPending}
                data-testid="button-save-new-app"
              >
                <ButtonLoading 
                  isLoading={createAppMutation.isPending}
                  loadingText="Creating..."
                >
                  Create App
                </ButtonLoading>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingApp} onOpenChange={(open) => !open && setDeletingApp(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete App</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingApp?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteAppMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              <ButtonLoading 
                isLoading={deleteAppMutation.isPending}
                loadingText="Deleting..."
              >
                Delete
              </ButtonLoading>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// Enhanced Apps page with error boundaries
export default function Apps(props: AppsProps) {
  return (
    <ErrorBoundary level="page" showDetails={false}>
      <QueryErrorBoundary level="page">
        <AppsContent {...props} />
      </QueryErrorBoundary>
    </ErrorBoundary>
  )
}