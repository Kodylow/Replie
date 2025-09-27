import { useState, useEffect } from 'react'
import { useLocation } from 'wouter'
import { Search, Home, FolderOpen, Package, Globe, Users, UserCheck, Settings, BookOpen, ExternalLink, Plus, Upload, BarChart3, LogOut, Bell, User as UserIcon, TerminalSquare, HelpCircle, Palette } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import type { Project, App } from '@shared/schema'
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu'

interface NavItemProps {
  icon: React.ComponentType<any>
  label: string
  active?: boolean
  onClick?: () => void
}

function NavItem({ icon: Icon, label, active = false, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center w-full px-3 py-2 text-sm rounded-md hover-elevate ${
        active ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground'
      }`}
      data-testid={`nav-${label.toLowerCase().replace(/\s+/g, '-')}`}
      aria-current={active ? 'page' : undefined}
    >
      <Icon className="w-4 h-4 mr-3" />
      {label}
    </button>
  )
}

function ActionButton({ icon: Icon, label, onClick }: NavItemProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className="w-full justify-start h-8 text-sm font-medium gap-2"
      data-testid={`action-${label.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </Button>
  )
}

interface SidebarProps {
  onSearchResults?: (results: Project[]) => void
  onClearSearch?: () => void
}

interface AppWithWorkspace extends App {
  workspaceName: string
}

export default function Sidebar({ onSearchResults, onClearSearch }: SidebarProps) {
  const [, setLocation] = useLocation()
  const [location] = useLocation()
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [isCommandOpen, setIsCommandOpen] = useState(false)
  const { workspaces, currentWorkspace } = useWorkspace()

  // Search apps across all workspaces
  const { data: searchResults, isLoading: searchLoading } = useQuery<AppWithWorkspace[]>({
    queryKey: ['/api/apps/search', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim() || workspaces.length === 0) return []
      
      // Search across all user's workspaces
      const searchPromises = workspaces.map(async (workspace) => {
        try {
          const response = await fetch(`/api/workspaces/${workspace.id}/apps/search/${encodeURIComponent(searchQuery.trim())}`)
          if (!response.ok) return []
          const apps = await response.json()
          return apps.map((app: App) => ({
            ...app,
            workspaceName: workspace.name
          }))
        } catch {
          return []
        }
      })
      
      const results = await Promise.all(searchPromises)
      return results.flat()
    },
    enabled: !!searchQuery.trim() && workspaces.length > 0,
  })

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    if (value.trim()) {
      setIsSearching(true)
      // Note: We're now searching apps, not projects, so we don't pass results to onSearchResults
      // which expects Project[] type. App search results are handled directly in the command dialog.
    } else {
      setIsSearching(false)
      if (onClearSearch) {
        onClearSearch()
      }
    }
  }

  const clearSearch = () => {
    setSearchQuery('')
    setIsSearching(false)
    if (onClearSearch) {
      onClearSearch()
    }
  }

  // Note: No longer passing app search results to parent component
  // as onSearchResults expects Project[] but we're now searching App[]
  return (
    <div className="w-64 h-screen bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between" style={{ paddingLeft: '6px', paddingRight: '8px', paddingTop: '12px', paddingBottom: '12px' }}>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-md p-0 hover:bg-sidebar-accent"
                aria-label="Open navigation menu"
                data-testid="button-logo-menu"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="text-[#F26207]">
                  <path d="M5.25 4.125C5.25 3.504 5.754 3 6.375 3h5.25c.621 0 1.125.504 1.125 1.125V9H6.375A1.125 1.125 0 0 1 5.25 7.875v-3.75ZM12.75 9h6.375c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125H12.75V9ZM5.25 16.125c0-.621.504-1.125 1.125-1.125h6.375v4.875c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 0 1-1.125-1.125v-3.75Z" />
                </svg>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="right" className="w-72">
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => setLocation('/account')}>
                  <Settings className="w-4 h-4 mr-2" />
                  Account
                  <span className="ml-auto text-xs text-[#F26207]">Core</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocation('/profile')}>
                  <UserIcon className="w-4 h-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocation('/notifications')}>
                  <Bell className="w-4 h-4 mr-2" />
                  Notifications
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocation('/teams/new')} data-testid="button-create-team">
                  <Users className="w-4 h-4 mr-2" />
                  Create Team
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocation('/clui')}>
                  <TerminalSquare className="w-4 h-4 mr-2" />
                  CLUI
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground">Switch Workspace</DropdownMenuLabel>
              {workspaces.map((workspace) => (
                <DropdownMenuItem key={workspace.id} onClick={() => setLocation('/projects')}>
                  <Avatar className="h-4 w-4 mr-2">
                    <AvatarImage src={workspace.avatarUrl || ""} alt={workspace.name} />
                    <AvatarFallback className="text-[10px]">
                      {workspace.type === 'personal' ? 'P' : workspace.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {workspace.name}
                  {workspace.type === 'team' && (
                    <span className="ml-auto text-xs text-muted-foreground">Admin</span>
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Palette className="w-4 h-4 mr-2" />
                  Theme
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={() => document.documentElement.classList.remove('dark')}>Light</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => document.documentElement.classList.add('dark')}>Dark</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => document.documentElement.classList.toggle('dark')}>Toggle</DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuItem onClick={() => setLocation('/help')}>
                <HelpCircle className="w-4 h-4 mr-2" />
                Help
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => (window.location.href = '/api/logout')} className="text-destructive focus:text-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 hover:bg-sidebar-accent"
            aria-label="Open search"
            data-testid="button-open-search"
            onClick={() => {
              setIsCommandOpen(true)
              setIsSearching(true)
            }}
          >
            <Search className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Create App */}
      <div className="px-4 pb-4">
        <ActionButton icon={Plus} label="Create App" onClick={() => setLocation('/planning')} />
      </div>

      {/* Import */}
      <div className="px-4 pb-4">
        <ActionButton icon={Upload} label="Import code or design" onClick={() => setLocation('/import')} />
      </div>

      <Separator className="mx-4 bg-sidebar-border" />

      {/* Navigation */}
      <div className="flex-1 px-4 py-4 space-y-1">
        <NavItem 
          icon={Home} 
          label="Home" 
          active={location === '/'} 
          onClick={() => setLocation('/')} 
        />
        <NavItem 
          icon={FolderOpen} 
          label="Projects" 
          active={location === '/projects'}
          onClick={() => setLocation('/projects')} 
        />
        <NavItem 
          icon={Package} 
          label="Apps" 
          active={location === '/apps'}
          onClick={() => setLocation('/apps')} 
        />
        <NavItem 
          icon={Globe} 
          label="Published apps" 
          active={location === '/published-apps'}
          onClick={() => setLocation('/published-apps')}
        />
        
        {/* Only show Manage Organization for team workspaces */}
        {currentWorkspace?.type === 'team' && (
          <div className="py-2">
            <p className="text-xs font-medium text-muted-foreground px-3 pb-2">Manage Organization</p>
            <NavItem 
              icon={Users} 
              label="Members" 
              active={location === '/members'}
              onClick={() => setLocation('/members')} 
            />
            <NavItem icon={UserCheck} label="Groups" onClick={() => {}} />
            <NavItem 
              icon={Settings} 
              label="Usage" 
              active={location === '/usage'}
              onClick={() => setLocation('/usage')} 
            />
            <NavItem 
              icon={BarChart3} 
              label="Analytics" 
              active={location === '/analytics'}
              onClick={() => setLocation('/analytics')} 
            />
            <NavItem icon={Settings} label="Profile" onClick={() => setLocation('/account')} />
            <NavItem icon={Settings} label="Settings" onClick={() => {}} />
          </div>
        )}
        
        <div className="py-2">
          <p className="text-xs font-medium text-muted-foreground px-3 pb-2">Explore Replit</p>
          <NavItem icon={BookOpen} label="Developer Frameworks" onClick={() => {}} />
          <NavItem icon={ExternalLink} label="Learn" onClick={() => {}} />
          <NavItem icon={BookOpen} label="Documentation" onClick={() => {}} />
        </div>
      </div>

      {/* User Profile */}
      <UserProfile />

      {/* Command Search Modal */}
      <CommandDialog
        open={isCommandOpen}
        onOpenChange={(open) => {
          setIsCommandOpen(open)
          if (!open) {
            clearSearch()
          }
        }}
      >
        <CommandInput
          placeholder="Search Apps"
          value={searchQuery}
          onValueChange={handleSearchChange}
        />
        <CommandList>
          {searchLoading ? (
            <CommandEmpty>Searching...</CommandEmpty>
          ) : !searchResults || searchResults.length === 0 ? (
            <CommandEmpty>No results found.</CommandEmpty>
          ) : (
            <CommandGroup heading="Apps">
              {searchResults.map((app) => (
                <CommandItem
                  key={app.id}
                  value={app.title}
                  onSelect={() => {
                    setIsCommandOpen(false)
                    setLocation(`/apps`)
                    clearSearch()
                  }}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-sm flex items-center justify-center text-xs font-bold" style={{ background: app.backgroundColor }}>
                      {app.title.charAt(0).toUpperCase()}
                    </div>
                    <span>{app.title}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{app.workspaceName}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </div>
  )
}

function UserProfile() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  const displayName = user.firstName && user.lastName 
    ? `${user.firstName} ${user.lastName}`
    : user.email || 'User';

  const initials = user.firstName && user.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`
    : user.email 
    ? user.email[0].toUpperCase()
    : 'U';

  return (
    <div className="p-4 border-t border-sidebar-border">
      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={user.profileImageUrl || undefined} alt={displayName} />
          <AvatarFallback className="text-xs">
            {initials}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-sidebar-foreground truncate">
            {displayName}
          </p>
          {user.email && (
            <p className="text-xs text-muted-foreground truncate">
              {user.email}
            </p>
          )}
        </div>

        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 hover:bg-sidebar-accent"
          onClick={() => window.location.href = '/api/logout'}
          data-testid="button-logout"
          title="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}