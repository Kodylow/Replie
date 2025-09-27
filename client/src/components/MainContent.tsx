import { useState, useEffect } from 'react'
import { useLocation } from 'wouter'
import { ArrowRight, Globe, Database, Gamepad2, Layers, Bot } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { useQuery, useMutation } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { useToast } from '@/hooks/use-toast'
import CategoryButton from './CategoryButton'
import ProjectCard from './ProjectCard'
import ProjectEditDialog from './ProjectEditDialog'
import type { Project, InsertProject } from '@shared/schema'

const categories = [
  { id: 'web', label: 'Web app', icon: <Globe className="w-4 h-4" /> },
  { id: 'data', label: 'Data app', icon: <Database className="w-4 h-4" /> },
  { id: 'game', label: '3D Game', icon: <Gamepad2 className="w-4 h-4" /> },
  { id: 'general', label: 'General', icon: <Layers className="w-4 h-4" /> },
  { id: 'agents', label: 'Agents & Automations', icon: <Bot className="w-4 h-4" />, badge: 'Beta' },
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

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  } else {
    return 'Just now'
  }
}

interface MainContentProps {
  searchResults?: Project[]
  isSearching?: boolean
}

export default function MainContent({ searchResults, isSearching = false }: MainContentProps) {
  const [, setLocation] = useLocation()
  const [projectIdea, setProjectIdea] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('web')
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [deletingProject, setDeletingProject] = useState<Project | null>(null)
  const { toast } = useToast()

  // Fetch projects
  const { data: allProjects = [], isLoading, refetch } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
    queryFn: () => fetch('/api/projects').then(res => res.json())
  })

  // Use search results if searching, otherwise use all projects
  const projects = isSearching ? (searchResults || []) : allProjects

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (projectData: InsertProject) => {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData)
      })
      if (!response.ok) throw new Error('Failed to create project')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] })
      queryClient.invalidateQueries({ queryKey: ['/api/projects/search'], exact: false })
      setProjectIdea('')
      toast({
        title: 'Project created!',
        description: 'Your new project has been created successfully.'
      })
    },
    onError: (error) => {
      console.error('Error creating project:', error)
      toast({
        title: 'Error',
        description: 'Failed to create project. Please try again.',
        variant: 'destructive'
      })
    }
  })

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
      queryClient.invalidateQueries({ queryKey: ['/api/projects/search'], exact: false })
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

  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Failed to delete project')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] })
      queryClient.invalidateQueries({ queryKey: ['/api/projects/search'], exact: false })
      setDeletingProject(null)
      toast({
        title: 'Project deleted!',
        description: 'Your project has been deleted successfully.'
      })
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

  const handleStartChat = () => {
    if (projectIdea.trim()) {
      const projectData: InsertProject = {
        title: projectIdea.trim(),
        description: `A ${categories.find(c => c.id === selectedCategory)?.label.toLowerCase()} project`,
        category: selectedCategory,
        isPrivate: 'true',
        backgroundColor: getRandomBackgroundColor()
      }
      
      createProjectMutation.mutate(projectData)
    }
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Greeting */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-foreground mb-6">
            Hi Kody, what do you want to make?
          </h1>
          
          {/* Project Idea Input */}
          <div className="relative max-w-2xl mx-auto mb-6">
            <Input
              placeholder="Describe the idea you want to build..."
              value={projectIdea}
              onChange={(e) => setProjectIdea(e.target.value)}
              className="pr-12 h-12 text-base"
              data-testid="input-project-idea"
            />
            <Button
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8"
              onClick={handleStartChat}
              disabled={!projectIdea.trim() || createProjectMutation.isPending}
              data-testid="button-start-chat"
            >
              Start chat
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          
          {/* Auto Theme Toggle */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <Button 
              variant="ghost" 
              size="sm"
              className="text-sm text-muted-foreground"
              data-testid="button-auto-theme"
            >
              Auto theme
            </Button>
          </div>
          
          {/* Categories */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {categories.map((category) => (
              <CategoryButton
                key={category.id}
                label={category.label}
                icon={category.icon}
                badge={category.badge}
                active={selectedCategory === category.id}
                onClick={() => {
                  setSelectedCategory(category.id)
                  console.log('Selected category:', category.id)
                }}
              />
            ))}
          </div>
        </div>
        
        {/* Recent Apps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              {isSearching ? 'Search Results' : 'Recent Apps'}
            </h2>
            <Button 
              variant="ghost" 
              size="sm"
              className="text-sm text-muted-foreground"
              data-testid="button-view-all"
              onClick={() => refetch()}
            >
              Refresh
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
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
      </div>
      
      {/* Edit Project Dialog */}
      <ProjectEditDialog
        project={editingProject}
        open={!!editingProject}
        onOpenChange={(open) => !open && setEditingProject(null)}
        onSave={async (projectId, data) => {
          await updateProjectMutation.mutateAsync({ id: projectId, data })
          setEditingProject(null)
        }}
        isLoading={updateProjectMutation.isPending}
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
              onClick={() => deletingProject && deleteProjectMutation.mutate(deletingProject.id)}
              disabled={deleteProjectMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-delete-confirm"
            >
              {deleteProjectMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}