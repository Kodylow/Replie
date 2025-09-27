import { useState } from 'react'
import { useLocation } from 'wouter'
import { ChevronDown, ChevronRight, MoreVertical, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useQuery } from '@tanstack/react-query'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { useAuth } from '@/hooks/useAuth'
import type { App } from '@shared/schema'

interface AppWithWorkspace extends App {
  workspaceName: string
}

export default function MobileAppsTab() {
  const [, setLocation] = useLocation()
  const { currentWorkspace } = useWorkspace()
  const { user } = useAuth()

  // Fetch apps from current workspace
  const { data: allApps = [], isLoading } = useQuery<AppWithWorkspace[]>({
    queryKey: ['/api/workspaces', currentWorkspace?.id, 'apps'],
    queryFn: () => fetch(`/api/workspaces/${currentWorkspace?.id}/apps`).then(res => res.json()),
    enabled: !!currentWorkspace
  })

  return (
    <div className="flex-1 overflow-auto pb-20 bg-background">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border">
        <h1 className="text-xl font-semibold text-foreground">Apps</h1>
      </div>

      {/* Teams Section */}
      <div className="border-b border-border">
        <button className="w-full flex items-center justify-between px-6 py-4 hover:bg-accent/50 transition-colors">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-muted-foreground" />
            <span className="font-medium text-foreground">Teams</span>
          </div>
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* All Apps Section */}
      <div className="border-b border-border">
        <button className="w-full flex items-center justify-between px-6 py-4 hover:bg-accent/50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 bg-muted rounded flex items-center justify-center">
              <div className="w-3 h-3 bg-foreground rounded-sm"></div>
            </div>
            <span className="font-medium text-foreground">All Apps</span>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Apps List */}
      <div className="px-6 py-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : allApps.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-sm">No apps yet</p>
            <p className="text-muted-foreground text-sm mt-1">
              Create your first app in the Create tab!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {allApps.map((app) => (
              <div
                key={app.id}
                className="bg-card border border-border rounded-lg overflow-hidden hover-elevate cursor-pointer"
                onClick={() => setLocation(`/editor/${app.id}`)}
                data-testid={`mobile-app-card-${app.id}`}
              >
                {/* Working Status Bar */}
                {app.filesInitialized === 'false' && (
                  <div className="bg-purple-100 dark:bg-purple-900/20 px-4 py-2 text-sm text-purple-700 dark:text-purple-300">
                    Working...
                  </div>
                )}
                
                {/* App Content */}
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {/* App Icon */}
                      <div className="w-12 h-12 bg-foreground rounded-lg flex items-center justify-center flex-shrink-0">
                        <div className="w-8 h-8 bg-orange-500 rounded border-2 border-background"></div>
                      </div>
                      
                      {/* App Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground text-base truncate">
                          {app.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {user?.firstName?.toLowerCase() || 'user'}
                        </p>
                        
                        {/* Status Badges */}
                        <div className="flex items-center gap-2 mt-2">
                          {app.isPublished === 'true' && (
                            <Badge variant="secondary" className="text-xs">
                              <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                              Deployed
                            </Badge>
                          )}
                          {app.isPrivate === 'false' && (
                            <Badge variant="outline" className="text-xs">
                              Public
                            </Badge>
                          )}
                          {app.isPrivate === 'true' && (
                            <Badge variant="outline" className="text-xs">
                              Private
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Menu Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        // Handle menu actions
                      }}
                      data-testid={`mobile-app-menu-${app.id}`}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}