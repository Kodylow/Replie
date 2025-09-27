import { useState } from 'react'
import { Search, Grid3X3, List, Star } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface PublishedApp {
  id: string
  name: string
  url?: string
  icon: string
  lastUpdated: string
  isStarred?: boolean
}

const SAMPLE_PUBLISHED_APPS: PublishedApp[] = [
  {
    id: '1',
    name: 'ReplitOnboard',
    icon: '🏠',
    lastUpdated: '2 days ago'
  },
  {
    id: '2', 
    name: 'KevinVoiceGenerator',
    url: 'kevinvoicegenerator.replit.app',
    icon: '🔊',
    lastUpdated: '1 year ago'
  },
  {
    id: '3',
    name: 'CostCompare', 
    url: 'cost-compare.replit.app',
    icon: '📊',
    lastUpdated: '1 month ago'
  },
  {
    id: '4',
    name: 'ProductClub-LandingPage',
    url: 'product-club-replit.replit.app', 
    icon: '🌐',
    lastUpdated: '1 year ago'
  },
  {
    id: '5',
    name: 'ReplitNewsBot',
    icon: '🤖',
    lastUpdated: '6 months ago'
  },
  {
    id: '6',
    name: 'VermeerListings',
    url: 'vermeer-listings.replit.app',
    icon: '🏡',
    lastUpdated: '1 year ago'
  }
]

interface PublishedAppsProps {
  searchResults: any[]
  isSearching: boolean
}

function AppCard({ app, isStarred }: { app: PublishedApp; isStarred?: boolean }) {
  return (
    <Card className="hover-elevate cursor-pointer group" data-testid={`card-published-app-${app.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center text-xl">
            {app.icon}
          </div>
          {isStarred && (
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
          )}
        </div>
        
        <div className="space-y-2">
          <h3 className="font-medium text-sm leading-tight" data-testid={`text-app-name-${app.id}`}>
            {app.name}
          </h3>
          
          {app.url && (
            <p className="text-xs text-muted-foreground truncate" data-testid={`text-app-url-${app.id}`}>
              {app.url}
            </p>
          )}
          
          <div className="flex items-center gap-1">
            <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
            <span className="text-xs text-muted-foreground" data-testid={`text-last-updated-${app.id}`}>
              Updated {app.lastUpdated}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function PublishedApps({ searchResults = [], isSearching }: PublishedAppsProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  
  const recentlyViewed = SAMPLE_PUBLISHED_APPS.slice(0, 1)
  const popularApps = SAMPLE_PUBLISHED_APPS.slice(1)
  const starredApps: PublishedApp[] = []
  
  // Filter apps based on search
  const filteredPopularApps = popularApps.filter(app =>
    app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (app.url && app.url.toLowerCase().includes(searchQuery.toLowerCase()))
  )
  
  const filteredRecentlyViewed = recentlyViewed.filter(app =>
    app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (app.url && app.url.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b bg-background">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
            <span className="text-xs text-primary-foreground font-bold">R</span>
          </div>
          <div>
            <h1 className="text-xl font-semibold" data-testid="text-page-title">
              Published apps
            </h1>
            <p className="text-sm text-muted-foreground">Replit - Demo</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-64"
              data-testid="input-search-published-apps"
            />
          </div>
          
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none border-0"
              data-testid="button-grid-view"
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none border-0"
              data-testid="button-list-view"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Starred Section */}
          <section>
            <h2 className="text-lg font-semibold mb-2" data-testid="text-starred-title">
              Starred
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Star your favorite apps for quick access
            </p>
            
            {starredApps.length === 0 ? (
              <div className="text-center py-12">
                <Star className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground">No starred apps yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {starredApps.map(app => (
                  <AppCard key={app.id} app={app} isStarred />
                ))}
              </div>
            )}
          </section>

          {/* Recently Viewed Section */}
          {filteredRecentlyViewed.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-4" data-testid="text-recently-viewed-title">
                Recently Viewed
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {filteredRecentlyViewed.map(app => (
                  <AppCard key={app.id} app={app} />
                ))}
              </div>
            </section>
          )}

          {/* Popular Apps Section */}
          {filteredPopularApps.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-4" data-testid="text-popular-apps-title">
                Popular Apps at Replit - Demo
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {filteredPopularApps.map(app => (
                  <AppCard key={app.id} app={app} />
                ))}
              </div>
            </section>
          )}

          {/* No Results */}
          {searchQuery && filteredPopularApps.length === 0 && filteredRecentlyViewed.length === 0 && (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">No apps found matching "{searchQuery}"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}