import { Button } from '@/components/ui/button'

export default function Header() {
  return (
    <header className="flex items-center justify-end px-6 py-3 border-b border-border bg-background">
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="sm"
          className="text-sm"
          data-testid="button-profile"
          onClick={() => {}}
        >
          Profile
        </Button>
      </div>
    </header>
  )
}