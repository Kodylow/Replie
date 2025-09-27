import { useState } from 'react'
import { useLocation } from 'wouter'
import { useQuery } from '@tanstack/react-query'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { useAuth } from '@/hooks/useAuth'
import { useProjectManagement } from '@/hooks/useProjectManagement'
import { WorkspaceDropdown } from '@/components/ui/WorkspaceDropdown'
import { ProjectCreationForm } from '@/components/ui/ProjectCreationForm'
import { formatTimeAgo } from '@/lib/utils/projectUtils'
import ProjectCard from './ProjectCard'
import ProjectEditDialog from './ProjectEditDialog'
import type { Project, InsertProject } from '@shared/schema'


interface MainContentProps {
  searchResults?: Project[]
  isSearching?: boolean
}

export default function MainContent({ searchResults, isSearching = false }: MainContentProps) {
  const [, setLocation] = useLocation()
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [deletingProject, setDeletingProject] = useState<Project | null>(null)
  const { currentWorkspace, isLoading: workspaceLoading } = useWorkspace()
  const { user } = useAuth()
  const { deleteProject, updateProject } = useProjectManagement()

  // Fetch projects from current workspace
  const { data: allProjects = [], isLoading, refetch } = useQuery<Project[]>({
    queryKey: ['/api/workspaces', currentWorkspace?.id, 'projects'],
    queryFn: () => fetch(`/api/workspaces/${currentWorkspace?.id}/projects`).then(res => res.json()),
    enabled: !!currentWorkspace
  })

  // Use search results if searching, otherwise use all projects
  const projects = isSearching ? (searchResults || []) : allProjects


  // Show loading state while workspace is loading (after hooks to preserve hook order)
  if (workspaceLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading workspace...</p>
        </div>
      </div>
    )
  }

  // Show message if no workspace available (after hooks to preserve hook order)
  if (!currentWorkspace) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">No workspace available</p>
        </div>
      </div>
    )
  }

  const handleDeleteProject = (project: Project) => {
    deleteProject.mutate(project.id)
    setDeletingProject(null)
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-4xl mx-auto px-6 py-16 md:py-24">
        {/* Workspace Dropdown */}
        <div className="flex justify-center mb-8">
          <WorkspaceDropdown onCreateTeam={() => setLocation('/teams/new')} />
        </div>

        {/* Greeting and Project Creation */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-foreground mb-6">
            {`Hi ${user?.firstName ?? 'there'}, what do you want to make?`}
          </h1>
          
          <ProjectCreationForm onProjectCreated={() => {}} />
        </div>
        
        {/* Recent Projects - Only show for team workspaces */}
        {currentWorkspace?.type === 'team' && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">
                {isSearching ? 'Search Results' : 'Recent Apps'}
              </h2>
            <button 
              onClick={() => refetch()}
              className="text-sm text-muted-foreground hover:text-foreground"
              data-testid="button-refresh"
            >
              Refresh
            </button>
          </div>
          
          {(isLoading && !isSearching) ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.length === 0 ? (
                <div className="col-span-full text-center py-8">
                  <p className="text-muted-foreground">No projects yet. Create your first project above!</p>
                </div>
              ) : (
                projects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    title={project.title}
                    description={project.description || undefined}
                    timeAgo={formatTimeAgo(new Date(project.updatedAt))}
                    isPrivate={project.isPrivate === 'true'}
                    backgroundColor={project.backgroundColor}
                    onClick={() => setLocation(`/project/${project.id}`)}
                    onEdit={() => setEditingProject(project)}
                    onDelete={() => setDeletingProject(project)}
                  />
                ))
              )}
            </div>
          )}
          </div>
        )}
      </div>
      
      {/* Edit Project Dialog */}
      <ProjectEditDialog
        project={editingProject}
        open={!!editingProject}
        onOpenChange={(open) => !open && setEditingProject(null)}
        onSave={async (projectId, data) => {
          await updateProject.mutateAsync({ id: projectId, data })
          setEditingProject(null)
        }}
        isLoading={updateProject.isPending}
      />
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingProject} onOpenChange={(open) => !open && setDeletingProject(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingProject?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-delete-cancel">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingProject && handleDeleteProject(deletingProject)}
              disabled={deleteProject.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-delete-confirm"
            >
              {deleteProject.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}