import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Search, Plus, MoreHorizontal, ExternalLink, Settings, Trash2, Globe, Database, Gamepad2, Layers, Bot } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
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
import { queryClient } from '@/lib/queryClient'
import ProjectEditDialog from '@/components/ProjectEditDialog'
import type { Project, InsertProject } from '@shared/schema'

const projectIcons = [
  'I', 'H', 'M', 'S', 'R', 'P', 'C', 'B', 'Y', 'W', 'Q', 'T', 'O', 'L', 'A', 'U'
]

const categories = [
  { id: 'web', label: 'Web app', icon: Globe },
  { id: 'data', label: 'Data app', icon: Database },
  { id: 'game', label: '3D Game', icon: Gamepad2 },
  { id: 'general', label: 'General', icon: Layers },
  { id: 'agents', label: 'Agents & Automations', icon: Bot },
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

function getProjectIcon(title: string) {
  const index = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % projectIcons.length
  return projectIcons[index]
}

function getDeploymentStatusDisplay(status: string | null) {
  if (!status) return null
  
  // Convert database values to display values
  switch (status.toLowerCase()) {
    case 'published':
      return 'Published'
    case 'failed':
      return 'Failed'
    default:
      return null
  }
}

interface ProjectsProps {
  searchResults: Project[]
  isSearching: boolean
}

export default function Projects({ searchResults, isSearching }: ProjectsProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deletingProject, setDeletingProject] = useState<Project | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newProjectTitle, setNewProjectTitle] = useState('')
  const [newProjectDescription, setNewProjectDescription] = useState('')
  const [newProjectCategory, setNewProjectCategory] = useState('web')
  const { toast } = useToast()

  // Fetch projects
  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
    queryFn: () => fetch('/api/projects').then(res => res.json())
  })

  // Use search results from App-level if searching, otherwise filter locally
  const filteredProjects = isSearching ? searchResults : (
    projects.filter(project => 
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  )

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
      setCreateDialogOpen(false)
      setNewProjectTitle('')
      setNewProjectDescription('')
      setNewProjectCategory('web')
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

  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/projects/${id}`, {
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

  const handleSaveProject = async (projectId: string, data: Partial<InsertProject>) => {
    await updateProjectMutation.mutateAsync({ id: projectId, data })
  }

  const handleEditProject = (project: Project) => {
    setEditingProject(project)
    setEditDialogOpen(true)
  }

  const handleDeleteProject = (project: Project) => {
    setDeletingProject(project)
  }

  const handleCreateProject = () => {
    setCreateDialogOpen(true)
  }

  const handleSaveNewProject = () => {
    if (newProjectTitle.trim()) {
      const projectData: InsertProject = {
        title: newProjectTitle.trim(),
        description: newProjectDescription.trim() || `A ${categories.find(c => c.id === newProjectCategory)?.label.toLowerCase()} project`,
        category: newProjectCategory,
        isPrivate: 'true',
        backgroundColor: getRandomBackgroundColor(),
        deploymentStatus: null // New projects start with no deployment status
      }
      
      createProjectMutation.mutate(projectData)
    }
  }

  const confirmDelete = () => {
    if (deletingProject) {
      deleteProjectMutation.mutate(deletingProject.id)
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-muted-foreground">Replit • Demo</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Projects</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search Projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
              data-testid="input-search-projects"
            />
          </div>
          <Button onClick={handleCreateProject} data-testid="button-create-project">
            <Plus className="w-4 h-4 mr-2" />
            Create Project
          </Button>
        </div>
      </div>

      {/* Projects Table */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="p-8">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-muted rounded animate-pulse" />
              ))}
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border">
                <TableHead className="w-[50%] text-left font-medium text-muted-foreground">
                  Name
                </TableHead>
                <TableHead className="w-[25%] text-left font-medium text-muted-foreground">
                  Who's Online
                </TableHead>
                <TableHead className="w-[20%] text-left font-medium text-muted-foreground">
                  Main Deployment
                </TableHead>
                <TableHead className="w-[5%]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProjects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    {(searchQuery || isSearching) ? 'No projects found matching your search.' : 'No projects yet. Create your first project!'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredProjects.map((project) => {
                  const deploymentStatus = getDeploymentStatusDisplay(project.deploymentStatus)
                  return (
                    <TableRow key={project.id} className="border-b border-border hover:bg-muted/50" data-testid={`row-project-${project.id}`}>
                      <TableCell className="flex items-center gap-3 py-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-muted text-muted-foreground text-sm font-medium">
                            {getProjectIcon(project.title)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-foreground" data-testid={`text-project-name-${project.id}`}>
                          {project.title}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground">–</span>
                      </TableCell>
                      <TableCell>
                        {deploymentStatus ? (
                          <Badge 
                            variant={deploymentStatus === 'Published' ? 'default' : 'destructive'}
                            className={
                              deploymentStatus === 'Published' 
                                ? 'bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20' 
                                : 'bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/20'
                            }
                            data-testid={`badge-status-${project.id}`}
                          >
                            {deploymentStatus}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">–</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0"
                              data-testid={`button-menu-${project.id}`}
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditProject(project)} data-testid={`menu-edit-${project.id}`}>
                              <Settings className="w-4 h-4 mr-2" />
                              Settings
                            </DropdownMenuItem>
                            <DropdownMenuItem data-testid={`menu-open-${project.id}`}>
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Open
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteProject(project)}
                              className="text-destructive focus:text-destructive"
                              data-testid={`menu-delete-${project.id}`}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Create Project Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="project-title">Project Title</Label>
              <Input
                id="project-title"
                placeholder="Enter project title..."
                value={newProjectTitle}
                onChange={(e) => setNewProjectTitle(e.target.value)}
                data-testid="input-new-project-title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-description">Description (optional)</Label>
              <Textarea
                id="project-description"
                placeholder="Describe your project..."
                value={newProjectDescription}
                onChange={(e) => setNewProjectDescription(e.target.value)}
                rows={3}
                data-testid="textarea-new-project-description"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-category">Category</Label>
              <Select value={newProjectCategory} onValueChange={setNewProjectCategory}>
                <SelectTrigger data-testid="select-new-project-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => {
                    const IconComponent = category.icon
                    return (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center gap-2">
                          <IconComponent className="w-4 h-4" />
                          {category.label}
                        </div>
                      </SelectItem>
                    )
                  })}
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
                onClick={handleSaveNewProject}
                disabled={!newProjectTitle.trim() || createProjectMutation.isPending}
                data-testid="button-save-new-project"
              >
                {createProjectMutation.isPending ? 'Creating...' : 'Create Project'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
      <AlertDialog open={!!deletingProject} onOpenChange={(open) => !open && setDeletingProject(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingProject?.title}"? This action cannot be undone.
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