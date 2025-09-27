import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface CategoryButtonProps {
  label: string
  icon?: React.ReactNode
  badge?: string
  active?: boolean
  onClick?: () => void
}

export default function CategoryButton({ label, icon, badge, active = false, onClick }: CategoryButtonProps) {
  return (
    <Button
      variant={active ? "default" : "ghost"}
      size="sm"
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 h-auto text-sm font-normal rounded-full ${
        active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
      data-testid={`category-${label.toLowerCase().replace(/\s+/g, '-')}`}
    >
      {icon}
      {label}
      {badge && (
        <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0.5 h-auto">
          {badge}
        </Badge>
      )}
    </Button>
  )
}