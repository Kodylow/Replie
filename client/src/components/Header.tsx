import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Header() {
  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-border bg-background">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-primary rounded-sm flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-xs">R</span>
        </div>
        <span className="text-sm font-medium text-foreground">Replit - Demo Workspace</span>
        <ChevronDown className="w-4 h-4 text-muted-foreground" />
      </div>
      
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="sm"
          className="text-sm"
          data-testid="button-profile"
          onClick={() => console.log('Profile clicked')}
        >
          Profile
        </Button>
      </div>
    </header>
  )
}