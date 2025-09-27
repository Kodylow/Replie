import { LogOut, Settings, User, Bell, CreditCard, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/hooks/useAuth'
import { useWorkspace } from '@/contexts/WorkspaceContext'

export default function MobileAccountTab() {
  const { user } = useAuth()
  const { currentWorkspace } = useWorkspace()

  const displayName = user?.firstName && user?.lastName 
    ? `${user.firstName} ${user.lastName}`
    : user?.email || 'User'

  const initials = user?.firstName && user?.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`
    : user?.email 
    ? user.email[0].toUpperCase()
    : 'U'

  const menuItems = [
    { icon: User, label: 'Profile', description: 'Manage your profile info', action: () => console.log('Profile') },
    { icon: Settings, label: 'Account Settings', description: 'Privacy and account preferences', action: () => console.log('Settings') },
    { icon: Bell, label: 'Notifications', description: 'Manage your notification preferences', action: () => console.log('Notifications') },
    { icon: CreditCard, label: 'Billing', description: 'View usage and billing info', action: () => console.log('Billing') },
    { icon: Shield, label: 'Privacy & Security', description: 'Manage your privacy settings', action: () => console.log('Privacy') },
  ]

  return (
    <div className="flex-1 overflow-auto pb-20"> {/* pb-20 for bottom nav space */}
      <div className="p-4">
        {/* User Profile Section */}
        <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg mb-6">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user?.profileImageUrl || undefined} alt={displayName} />
            <AvatarFallback className="text-lg font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-foreground truncate">
              {displayName}
            </h2>
            {user?.email && (
              <p className="text-sm text-muted-foreground truncate">
                {user.email}
              </p>
            )}
            {currentWorkspace && (
              <p className="text-xs text-muted-foreground mt-1">
                {currentWorkspace.name} • {currentWorkspace.type}
              </p>
            )}
          </div>
        </div>

        {/* Menu Items */}
        <div className="space-y-1">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={item.action}
              className="w-full flex items-center gap-3 p-4 rounded-lg hover-elevate text-left"
              data-testid={`mobile-account-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center shrink-0">
                <item.icon className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground">
                  {item.label}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </button>
          ))}
        </div>

        <Separator className="my-6" />

        {/* Sign Out */}
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 h-auto p-4 rounded-lg"
          onClick={() => window.location.href = '/api/logout'}
          data-testid="mobile-account-sign-out"
        >
          <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center shrink-0 mr-3">
            <LogOut className="w-5 h-5 text-destructive" />
          </div>
          <div className="text-left">
            <h3 className="font-medium">Sign Out</h3>
            <p className="text-sm text-muted-foreground">
              Sign out of your account
            </p>
          </div>
        </Button>
      </div>
    </div>
  )
}