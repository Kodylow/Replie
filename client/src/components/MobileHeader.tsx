import { useState } from 'react'
import { ChevronDown, MoreVertical, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { useAuth } from '@/hooks/useAuth'

export default function MobileHeader() {
  const { workspaces, currentWorkspace, setCurrentWorkspace } = useWorkspace()
  const { user } = useAuth()

  return (
    <div className="flex items-center justify-between p-4 border-b border-border bg-background">
      {/* Workspace Selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            className="flex items-center gap-2 text-sm font-medium p-2 h-auto"
            data-testid="mobile-workspace-selector"
          >
            <Avatar className="h-6 w-6">
              <AvatarImage src={currentWorkspace?.avatarUrl || ""} alt={currentWorkspace?.name || ""} />
              <AvatarFallback className="text-xs">
                {currentWorkspace?.type === 'personal' ? 'P' : currentWorkspace?.name?.charAt(0)?.toUpperCase() || 'W'}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium">{currentWorkspace?.name || 'Workspace'}</span>
            <ChevronDown className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          {workspaces.map((workspace) => (
            <DropdownMenuItem
              key={workspace.id}
              onClick={() => setCurrentWorkspace(workspace)}
              className={workspace.id === currentWorkspace?.id ? 'bg-accent' : ''}
              data-testid={`mobile-workspace-${workspace.slug}`}
            >
              <div className="flex items-center gap-2">
                <Avatar className="h-4 w-4">
                  <AvatarImage src={workspace.avatarUrl || ""} alt={workspace.name} />
                  <AvatarFallback className="text-xs">
                    {workspace.type === 'personal' ? 'P' : workspace.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {workspace.name}
                <span className="text-muted-foreground text-xs ml-auto">({workspace.type})</span>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon"
            className="h-8 w-8"
            data-testid="mobile-menu-trigger"
          >
            <MoreVertical className="w-5 h-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem>
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive focus:text-destructive">
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}