import { useState } from 'react'
import { useLocation } from 'wouter'
import { Search, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useQuery } from '@tanstack/react-query'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import ProjectCard from './ProjectCard'
import type { Project } from '@shared/schema'

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffDays > 0) {
    return `${diffDays}d ago`
  } else if (diffHours > 0) {
    return `${diffHours}h ago`
  } else {
    return 'Now'
  }
}

export default function MobileAppsTab() {
  const [, setLocation] = useLocation()
  const [searchQuery, setSearchQuery] = useState('')
  const { currentWorkspace } = useWorkspace()

  // Fetch projects from current workspace
  const { data: allProjects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['/api/workspaces', currentWorkspace?.id, 'projects'],
    queryFn: () => fetch(`/api/workspaces/${currentWorkspace?.id}/projects`).then(res => res.json()),
    enabled: !!currentWorkspace
  })

  // Filter projects based on search query
  const projects = allProjects.filter(project => 
    searchQuery === '' || 
    project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="flex-1 overflow-auto pb-20"> {/* pb-20 for bottom nav space */}
      {/* Search */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search apps..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="mobile-apps-search"
          />
        </div>
      </div>

      {/* Projects Grid */}
      <div className="p-4">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-sm">
              {searchQuery ? 'No apps found' : 'No apps yet'}
            </p>
            {!searchQuery && (
              <p className="text-muted-foreground text-sm mt-1">
                Create your first app in the Create tab!
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {projects.map((project) => (
              <div
                key={project.id}
                className="border border-border rounded-lg p-4 hover-elevate"
                onClick={() => setLocation(`/project/${project.id}`)}
                data-testid={`mobile-project-card-${project.id}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground truncate">
                      {project.title}
                    </h3>
                    {project.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {project.description}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 ml-2"
                    onClick={(e) => {
                      e.stopPropagation()
                      // Handle menu actions
                    }}
                    data-testid={`mobile-project-menu-${project.id}`}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{formatTimeAgo(new Date(project.updatedAt))}</span>
                  <span className="capitalize">{project.category}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}