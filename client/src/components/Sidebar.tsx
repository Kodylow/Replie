import { Search, Home, FolderOpen, Package, Globe, Users, UserCheck, Settings, BookOpen, ExternalLink, Plus, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'

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

export default function Sidebar() {
  return (
    <div className="w-64 h-screen bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="p-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">R</span>
          </div>
          <span className="font-semibold text-sidebar-foreground">Replit</span>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 pb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search"
            className="pl-10 bg-sidebar border-sidebar-border"
            data-testid="input-search"
          />
        </div>
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
        <NavItem icon={Home} label="Home" active onClick={() => console.log('Home clicked')} />
        <NavItem icon={FolderOpen} label="Projects" onClick={() => console.log('Projects clicked')} />
        <NavItem icon={Package} label="Apps" onClick={() => console.log('Apps clicked')} />
        <NavItem icon={Globe} label="Published apps" onClick={() => console.log('Published apps clicked')} />
        
        <div className="py-2">
          <p className="text-xs font-medium text-muted-foreground px-3 pb-2">Manage Organization</p>
          <NavItem icon={Users} label="Members" onClick={() => console.log('Members clicked')} />
          <NavItem icon={UserCheck} label="Groups" onClick={() => console.log('Groups clicked')} />
          <NavItem icon={Settings} label="Usage" onClick={() => console.log('Usage clicked')} />
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

      {/* Install Replit */}
      <div className="p-4">
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full justify-start text-sm font-normal"
          data-testid="button-install-replit"
        >
          Install Replit on
        </Button>
      </div>
    </div>
  )
}