import { useState, useEffect } from 'react'
import { useLocation } from 'wouter'
import { Search, Home, FolderOpen, Package, Globe, Users, UserCheck, Settings, BookOpen, ExternalLink, Plus, Upload, X, Menu, BarChart3, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import type { Project } from '@shared/schema'

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
      variant="ghost"
      size="sm"
      onClick={onClick}
      className="flex items-center justify-start w-full px-3 py-2 h-auto text-sm font-normal"
      data-testid={`action-${label.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <Icon className="w-4 h-4 mr-3" />
      {label}
    </Button>
  )
}

interface SidebarProps {
  onSearchResults?: (results: Project[]) => void
  onClearSearch?: () => void
}

export default function Sidebar({ onSearchResults, onClearSearch }: SidebarProps) {
  const [, setLocation] = useLocation()
  const [location] = useLocation()
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  // Search projects query
  const { data: searchResults, isLoading: searchLoading } = useQuery<Project[]>({
    queryKey: ['/api/projects/search', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return []
      const response = await fetch(`/api/projects/search/${encodeURIComponent(searchQuery.trim())}`)
      if (!response.ok) throw new Error('Search failed')
      return response.json()
    },
    enabled: !!searchQuery.trim(),
  })

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    if (value.trim()) {
      setIsSearching(true)
      if (searchResults && onSearchResults) {
        onSearchResults(searchResults)
      }
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

  // Update search results when query data changes
  useEffect(() => {
    if (isSearching && searchResults && onSearchResults) {
      onSearchResults(searchResults)
    }
  }, [searchResults, isSearching, onSearchResults])
  return (
    <div className="w-64 h-screen bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="flex items-center justify-between" style={{ paddingLeft: '6px', paddingRight: '8px', paddingTop: '12px', paddingBottom: '12px' }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">R</span>
          </div>
          <span className="font-semibold text-sidebar-foreground">Replit</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 hover:bg-sidebar-accent"
          aria-label="Toggle sidebar"
          data-testid="button-sidebar-toggle"
        >
          <Menu className="w-4 h-4" />
        </Button>
      </div>

      {/* Search */}
      <div className="px-4 pb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 pr-8 bg-sidebar border-sidebar-border"
            data-testid="input-search"
          />
          {(searchQuery || isSearching) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-sidebar-accent"
              data-testid="button-clear-search"
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
        {isSearching && (
          <div className="mt-2 text-xs text-muted-foreground px-2">
            {searchLoading ? (
              'Searching...'
            ) : searchResults ? (
              `${searchResults.length} result${searchResults.length !== 1 ? 's' : ''} found`
            ) : (
              'No results found'
            )}
          </div>
        )}
      </div>

      {/* Create App */}
      <div className="px-4 pb-4">
        <ActionButton icon={Plus} label="Create App" onClick={() => console.log('Create app clicked')} />
      </div>

      {/* Import */}
      <div className="px-4 pb-4">
        <ActionButton icon={Upload} label="Import code or design" onClick={() => console.log('Import clicked')} />
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
        
        <div className="py-2">
          <p className="text-xs font-medium text-muted-foreground px-3 pb-2">Manage Organization</p>
          <NavItem 
            icon={Users} 
            label="Members" 
            active={location === '/members'}
            onClick={() => setLocation('/members')} 
          />
          <NavItem icon={UserCheck} label="Groups" onClick={() => console.log('Groups clicked')} />
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
          <NavItem icon={Settings} label="Profile" onClick={() => console.log('Profile clicked')} />
          <NavItem icon={Settings} label="Settings" onClick={() => console.log('Settings clicked')} />
        </div>
        
        <div className="py-2">
          <p className="text-xs font-medium text-muted-foreground px-3 pb-2">Explore Replit</p>
          <NavItem icon={BookOpen} label="Developer Frameworks" onClick={() => console.log('Frameworks clicked')} />
          <NavItem icon={ExternalLink} label="Learn" onClick={() => console.log('Learn clicked')} />
          <NavItem icon={BookOpen} label="Documentation" onClick={() => console.log('Documentation clicked')} />
        </div>
      </div>

      {/* User Profile */}
      <UserProfile />
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