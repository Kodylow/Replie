import { FolderOpen, Plus, User } from 'lucide-react'

interface MobileBottomNavProps {
  activeTab: 'apps' | 'create' | 'account'
  onTabChange: (tab: 'apps' | 'create' | 'account') => void
}

export default function MobileBottomNav({ activeTab, onTabChange }: MobileBottomNavProps) {
  const tabs = [
    { id: 'apps' as const, label: 'Apps', icon: FolderOpen },
    { id: 'create' as const, label: 'Create', icon: Plus },
    { id: 'account' as const, label: 'Account', icon: User },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
      <div className="flex items-center justify-around py-2">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`flex flex-col items-center py-2 px-4 min-w-0 flex-1 ${
              activeTab === id
                ? 'text-foreground'
                : 'text-muted-foreground'
            }`}
            data-testid={`mobile-tab-${id}`}
          >
            <Icon className={`w-6 h-6 mb-1 ${activeTab === id ? 'text-foreground' : 'text-muted-foreground'}`} />
            <span className={`text-xs font-medium ${
              activeTab === id 
                ? 'text-foreground border-b-2 border-foreground pb-1' 
                : 'text-muted-foreground'
            }`}>
              {label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}