import { useState } from 'react'
import { useParams, useLocation } from 'wouter'
import { useQuery, useMutation } from '@tanstack/react-query'
import { ArrowLeft, Edit2, Trash2, ExternalLink, Calendar, Tag, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { queryClient } from '@/lib/queryClient'
import ProjectEditDialog from '@/components/ProjectEditDialog'
import type { Project, InsertProject } from '@shared/schema'

export default function ProjectDetail() {
  const { id } = useParams()
  const [, setLocation] = useLocation()
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const { toast } = useToast()

  // Fetch single project
  const { data: project, isLoading, error } = useQuery<Project>({
    queryKey: ['/api/projects', id],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${id}`)
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Project not found')
        }
        throw new Error('Failed to fetch project')
      }
      return response.json()
    },
    enabled: !!id
  })

  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Failed to delete project')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] })
      queryClient.invalidateQueries({ queryKey: ['/api/projects/search'], exact: false })
      toast({
        title: 'Project deleted!',
        description: 'Your project has been deleted successfully.'
      })
      setLocation('/')
    },
    onError: (error) => {
      console.error('Error deleting project:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete project. Please try again.',
        variant: 'destructive'
      })
    }
  })

  const handleEdit = () => {
    if (project) {
      setEditingProject(project)
      setEditDialogOpen(true)
    }
  }

  // Update project mutation
  const updateProjectMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertProject> }) => {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error('Failed to update project')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] })
      queryClient.invalidateQueries({ queryKey: ['/api/projects', id] })
      queryClient.invalidateQueries({ queryKey: ['/api/projects/search'], exact: false })
      setEditDialogOpen(false)
      setEditingProject(null)
      toast({
        title: 'Project updated!',
        description: 'Your project has been updated successfully.'
      })
    },
    onError: (error) => {
      console.error('Error updating project:', error)
      toast({
        title: 'Error',
        description: 'Failed to update project. Please try again.',
        variant: 'destructive'
      })
    }
  })

  const handleSaveProject = async (projectId: string, data: Partial<InsertProject>) => {
    await updateProjectMutation.mutateAsync({ id: projectId, data })
  }

  const handleDelete = () => {
    setShowDeleteDialog(true)
  }

  const confirmDelete = () => {
    deleteProjectMutation.mutate()
    setShowDeleteDialog(false)
  }

  // Create app from project and navigate to editor
  const createAppMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/workspaces/${project?.workspaceId}/apps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: project?.title || 'New App',
          creator: 'user',
        })
      })
      if (!response.ok) throw new Error('Failed to create app')
      return response.json()
    },
    onSuccess: (newApp) => {
      toast({
        title: 'App created!',
        description: 'Opening in editor...'
      })
      setLocation(`/editor/${newApp.id}`)
    },
    onError: (error) => {
      console.error('Error creating app:', error)
      toast({
        title: 'Error',
        description: 'Failed to create app. Please try again.',
        variant: 'destructive'
      })
    }
  })

  const handleViewCode = () => {
    if (project) {
      createAppMutation.mutate()
    }
  }

  const handleOpenProject = () => {
    if (project) {
      createAppMutation.mutate()
    }
  }

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'web': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      'data': 'bg-purple-500/10 text-purple-600 border-purple-500/20',
      'game': 'bg-green-500/10 text-green-600 border-green-500/20',
      'general': 'bg-gray-500/10 text-gray-600 border-gray-500/20',
      'agents': 'bg-orange-500/10 text-orange-600 border-orange-500/20',
      'other': 'bg-gray-500/10 text-gray-600 border-gray-500/20'
    }
    return colors[category] || colors['other']
  }

  const getCategoryLabel = (category: string) => {
    const labels: { [key: string]: string } = {
      'web': 'Web app',
      'data': 'Data app',
      'game': '3D Game',
      'general': 'General',
      'agents': 'Agents & Automations',
      'other': 'Other'
    }
    return labels[category] || 'Unknown'
  }

  if (isLoading) {
    return (
      <div className="h-full">
        <div className="max-w-4xl mx-auto p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-6"></div>
            <div className="h-64 bg-muted rounded mb-6"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Project Not Found</h1>
          <p className="text-muted-foreground mb-6">The project you're looking for doesn't exist or has been deleted.</p>
          <Button onClick={() => setLocation('/')} data-testid="button-back-home">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button 
            variant="ghost" 
            onClick={() => setLocation('/')}
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Projects
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleEdit} data-testid="button-edit-project">
              <Edit2 className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button variant="destructive" onClick={handleDelete} data-testid="button-delete-project">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        {/* Project Details */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-3xl mb-2" data-testid="text-project-title">
                  {project.title}
                </CardTitle>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Tag className="w-4 h-4" />
                    <Badge 
                      variant="secondary" 
                      className={getCategoryColor(project.category)}
                      data-testid="text-project-category"
                    >
                      {getCategoryLabel(project.category)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span data-testid="text-project-created">
                      Created {new Date(project.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleOpenProject}
                disabled={createAppMutation.isPending}
                data-testid="button-open-project"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                {createAppMutation.isPending ? 'Creating...' : 'Open Project'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Separator className="mb-4" />
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Description
                </h3>
                <p className="text-muted-foreground leading-relaxed" data-testid="text-project-description">
                  {project.description || 'No description provided.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Project Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Project Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Project ID</span>
                <span className="font-mono text-sm" data-testid="text-project-id">{project.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Category</span>
                <Badge 
                  variant="secondary" 
                  className={getCategoryColor(project.category)}
                  data-testid="text-project-category-detail"
                >
                  {getCategoryLabel(project.category)}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span data-testid="text-project-created-detail">
                  {new Date(project.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Updated</span>
                <span data-testid="text-project-updated">
                  {new Date(project.updatedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                onClick={handleViewCode}
                disabled={createAppMutation.isPending}
                data-testid="button-view-code"
              >
                <FileText className="w-4 h-4 mr-2" />
                {createAppMutation.isPending ? 'Creating...' : 'View Code'}
              </Button>
              <Button variant="outline" className="w-full justify-start" data-testid="button-project-settings">
                <Edit2 className="w-4 h-4 mr-2" />
                Project Settings
              </Button>
              <Button variant="outline" className="w-full justify-start" data-testid="button-share-project">
                <ExternalLink className="w-4 h-4 mr-2" />
                Share Project
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      <ProjectEditDialog
        project={editingProject}
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open)
          if (!open) {
            setEditingProject(null)
          }
        }}
        onSave={handleSaveProject}
        isLoading={updateProjectMutation.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{project.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteProjectMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteProjectMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}