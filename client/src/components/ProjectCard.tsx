import { MoreVertical, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface ProjectCardProps {
  title: string
  description?: string
  timeAgo: string
  isPrivate?: boolean
  thumbnail?: string
  backgroundColor?: string
  onClick?: () => void
}

export default function ProjectCard({ 
  title, 
  description, 
  timeAgo, 
  isPrivate = false, 
  thumbnail,
  backgroundColor = 'bg-muted',
  onClick 
}: ProjectCardProps) {
  return (
    <Card className="group hover-elevate cursor-pointer" onClick={onClick} data-testid={`card-project-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardContent className="p-0">
        {/* Thumbnail */}
        <div className={`relative h-32 ${backgroundColor} rounded-t-lg overflow-hidden`}>
          {thumbnail ? (
            <img src={thumbnail} alt={title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-2xl font-bold text-muted-foreground opacity-50">{title.charAt(0)}</span>
            </div>
          )}
          
          {/* Actions */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button 
              variant="ghost" 
              size="icon"
              className="h-6 w-6 bg-background/80 hover:bg-background"
              onClick={(e) => {
                e.stopPropagation()
                console.log(`More actions for ${title}`)
              }}
              data-testid={`button-more-${title.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <MoreVertical className="w-3 h-3" />
            </Button>
          </div>
          
          {/* Description overlay */}
          {description && (
            <div className="absolute bottom-2 left-2 right-2">
              <p className="text-xs text-white bg-black/50 rounded px-2 py-1 line-clamp-2">
                {description}
              </p>
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm text-foreground truncate">{title}</h3>
              <p className="text-xs text-muted-foreground mt-1">{timeAgo}</p>
            </div>
          </div>
          
          {/* Private badge */}
          {isPrivate && (
            <div className="flex items-center gap-1 mt-2">
              <Lock className="w-3 h-3 text-muted-foreground" />
              <Badge variant="secondary" className="text-xs px-1.5 py-0.5 h-auto">
                Private
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}