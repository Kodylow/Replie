import { useState } from 'react'
import { Download, TrendingUp, TrendingDown, AlertTriangle, Shield, ChevronDown, BarChart3, Trophy, Code, Rocket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface AnalyticsProps {
  searchResults: any[]
  isSearching: boolean
}

// Sample chart data - representing the line chart from the reference
const chartData = [
  { x: 1, y: 5 },
  { x: 2, y: 12 },
  { x: 3, y: 15 },
  { x: 4, y: 11 },
  { x: 5, y: 25 },
  { x: 6, y: 17 },
  { x: 7, y: 19 },
  { x: 8, y: 16 }
]

// Sample activity data
const activityData = [
  {
    id: '1',
    user: 'theflowinxsky',
    action: 'started following you',
    time: '14 minutes ago',
    avatar: '/api/placeholder/32/32'
  },
  {
    id: '2', 
    user: 'theflowinxsky',
    action: 'started following you',
    time: '14 minutes ago',
    avatar: '/api/placeholder/32/32'
  },
  {
    id: '3',
    user: 'theflowinxsky', 
    action: 'started following you',
    time: '14 minutes ago',
    avatar: '/api/placeholder/32/32'
  }
]

// Leaderboard data
const leaderboardData = [
  {
    id: '1',
    user: 'alex.smith',
    name: 'Alex Smith',
    avatar: '/api/placeholder/40/40',
    checkpoints: 47,
    appsCreated: 12,
    deployments: 8,
    rank: 1
  },
  {
    id: '2',
    user: 'sarah.chen',
    name: 'Sarah Chen',
    avatar: '/api/placeholder/40/40',
    checkpoints: 42,
    appsCreated: 15,
    deployments: 6,
    rank: 2
  },
  {
    id: '3',
    user: 'mike.jones',
    name: 'Mike Jones',
    avatar: '/api/placeholder/40/40',
    checkpoints: 38,
    appsCreated: 9,
    deployments: 11,
    rank: 3
  },
  {
    id: '4',
    user: 'emily.davis',
    name: 'Emily Davis',
    avatar: '/api/placeholder/40/40',
    checkpoints: 35,
    appsCreated: 7,
    deployments: 5,
    rank: 4
  },
  {
    id: '5',
    user: 'david.kim',
    name: 'David Kim',
    avatar: '/api/placeholder/40/40',
    checkpoints: 31,
    appsCreated: 6,
    deployments: 9,
    rank: 5
  }
]

function SimpleLineChart({ data }: { data: any[] }) {
  const maxY = Math.max(...data.map(d => d.y))
  const width = 400
  const height = 200
  const padding = 40
  
  const xScale = (x: number) => ((x - 1) / (data.length - 1)) * (width - 2 * padding) + padding
  const yScale = (y: number) => height - padding - (y / maxY) * (height - 2 * padding)
  
  const pathData = data.map((d, i) => 
    `${i === 0 ? 'M' : 'L'} ${xScale(d.x)} ${yScale(d.y)}`
  ).join(' ')
  
  return (
    <div className="relative w-full h-64 flex items-center justify-center">
      <svg width={width} height={height} className="border border-border rounded">
        {/* Grid lines */}
        {[0, 10, 20, 30].map(y => (
          <g key={y}>
            <line 
              x1={padding} 
              y1={yScale(y)} 
              x2={width - padding} 
              y2={yScale(y)} 
              stroke="#e5e7eb" 
              strokeDasharray="2,2"
            />
            <text x={20} y={yScale(y) + 4} fontSize="10" fill="#6b7280">{y}</text>
          </g>
        ))}
        
        {/* Main line */}
        <path
          d={pathData}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
        />
        
        {/* Data points */}
        {data.map((d, i) => (
          <circle
            key={i}
            cx={xScale(d.x)}
            cy={yScale(d.y)}
            r="4"
            fill="#3b82f6"
          />
        ))}
        
        {/* Today marker */}
        <line 
          x1={xScale(7)} 
          y1={padding} 
          x2={xScale(7)} 
          y2={height - padding} 
          stroke="#ef4444" 
          strokeDasharray="4,4"
        />
        <text x={xScale(7) - 15} y={height - 10} fontSize="10" fill="#ef4444">Today</text>
      </svg>
    </div>
  )
}

function MetricCard({ title, value, subtitle, trend, trendValue }: {
  title: string
  value: string | number
  subtitle?: string
  trend: 'up' | 'down'
  trendValue: string
}) {
  const TrendIcon = trend === 'up' ? TrendingUp : TrendingDown
  const trendColor = trend === 'up' ? 'text-green-600' : 'text-red-600'
  const bgColor = trend === 'up' ? 'bg-green-100' : 'bg-red-100'
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          {title}
          <Button variant="ghost" size="icon" className="h-4 w-4">
            <span className="text-muted-foreground">?</span>
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">{value}</span>
            {subtitle && <span className="text-sm text-muted-foreground">{subtitle}</span>}
          </div>
          <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${bgColor} ${trendColor}`}>
            <TrendIcon className="w-3 h-3" />
            <span>{trendValue} to last period</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function SecuritySection() {
  const securityItems = [
    { type: 'Critical', count: 20, color: 'bg-red-500' },
    { type: 'Warning', count: 20, color: 'bg-orange-500' },
    { type: 'Warning', count: 20, color: 'bg-orange-500' },
    { type: 'Warning', count: 20, color: 'bg-orange-500' }
  ]
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Shield className="w-4 h-4" />
          Security Scan
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-4">
          {securityItems.map((item, index) => (
            <div key={index} className="text-center">
              <div className={`w-2 h-2 ${item.color} rounded-full mx-auto mb-2`}></div>
              <div className="text-xs text-muted-foreground mb-1">{item.type}</div>
              <div className="text-2xl font-bold">{item.count}</div>
            </div>
          ))}
        </div>
        
        <div className="flex gap-2">
          <Button size="sm" className="flex-1">
            <Shield className="w-4 h-4 mr-2" />
            Run Security Scan
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            View all issues
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground">
          last updated 6/27/22 for Amoeba
        </p>
      </CardContent>
    </Card>
  )
}

function ActivitySection() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Activity</CardTitle>
          <Select defaultValue="user">
            <SelectTrigger className="w-32 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">Grouped by: User</SelectItem>
              <SelectItem value="time">Grouped by: Time</SelectItem>
              <SelectItem value="action">Grouped by: Action</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {activityData.map((activity) => (
          <div key={activity.id} className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={activity.avatar} alt={activity.user} />
              <AvatarFallback className="text-xs">
                {activity.user.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm">
                <span className="font-medium text-blue-600">{activity.user}</span>{' '}
                <span className="text-muted-foreground">{activity.action}</span>
              </p>
              <p className="text-xs text-muted-foreground">{activity.time}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function LeaderboardSection() {
  const [sortBy, setSortBy] = useState('checkpoints')
  
  const sortedData = [...leaderboardData].sort((a, b) => {
    if (sortBy === 'checkpoints') return b.checkpoints - a.checkpoints
    if (sortBy === 'apps') return b.appsCreated - a.appsCreated
    if (sortBy === 'deployments') return b.deployments - a.deployments
    return 0
  })

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />
    if (rank === 2) return <Trophy className="w-5 h-5 text-gray-400" />
    if (rank === 3) return <Trophy className="w-5 h-5 text-amber-600" />
    return <span className="w-5 h-5 flex items-center justify-center text-sm font-medium text-muted-foreground">#{rank}</span>
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Team Leaderboard
          </CardTitle>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="checkpoints">Sort by: Checkpoints</SelectItem>
              <SelectItem value="apps">Sort by: Apps Created</SelectItem>
              <SelectItem value="deployments">Sort by: Deployments</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Headers */}
          <div className="grid grid-cols-12 gap-4 text-xs font-medium text-muted-foreground pb-2 border-b">
            <div className="col-span-1">Rank</div>
            <div className="col-span-4">User</div>
            <div className="col-span-2 text-center">
              <div className="flex items-center justify-center gap-1">
                <Shield className="w-3 h-3" />
                Checkpoints
              </div>
            </div>
            <div className="col-span-2 text-center">
              <div className="flex items-center justify-center gap-1">
                <Code className="w-3 h-3" />
                Apps Created
              </div>
            </div>
            <div className="col-span-3 text-center">
              <div className="flex items-center justify-center gap-1">
                <Rocket className="w-3 h-3" />
                Deployments
              </div>
            </div>
          </div>

          {/* Leaderboard entries */}
          {sortedData.map((user, index) => (
            <div key={user.id} className="grid grid-cols-12 gap-4 items-center py-3 hover:bg-muted/50 rounded-lg px-2 -mx-2 transition-colors">
              <div className="col-span-1 flex items-center justify-center">
                {getRankIcon(index + 1)}
              </div>
              <div className="col-span-4 flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="text-xs">
                    {user.name.split(' ').map(n => n.charAt(0)).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">@{user.user}</p>
                </div>
              </div>
              <div className="col-span-2 text-center">
                <Badge variant="secondary" className="font-mono">
                  {user.checkpoints}
                </Badge>
              </div>
              <div className="col-span-2 text-center">
                <Badge variant="secondary" className="font-mono">
                  {user.appsCreated}
                </Badge>
              </div>
              <div className="col-span-3 text-center">
                <Badge variant="secondary" className="font-mono">
                  {user.deployments}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default function Analytics({ searchResults = [], isSearching }: AnalyticsProps) {
  const [selectedMonth, setSelectedMonth] = useState('september-2025')
  const [activeTab, setActiveTab] = useState('leaderboard')

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
              Analytics
            </h1>
            <p className="text-sm text-muted-foreground">Replit</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-40" data-testid="select-month">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="september-2025">Month: September 2025</SelectItem>
              <SelectItem value="august-2025">Month: August 2025</SelectItem>
              <SelectItem value="july-2025">Month: July 2025</SelectItem>
            </SelectContent>
          </Select>
          
          <Button className="gap-2" data-testid="button-export-csv">
            <Download className="w-4 h-4" />
            Export to CSV
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="leaderboard" data-testid="tab-leaderboard">
                Leaderboard
              </TabsTrigger>
              <TabsTrigger value="engagement" data-testid="tab-engagement">
                Engagement
              </TabsTrigger>
              <TabsTrigger value="security-deployments" data-testid="tab-security-deployments">
                Security & Deployments
              </TabsTrigger>
            </TabsList>

            <TabsContent value="leaderboard" className="space-y-6">
              <LeaderboardSection />
            </TabsContent>

            <TabsContent value="engagement" className="space-y-6">
              {/* Chart and Metrics */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Engagement Over Time</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <SimpleLineChart data={chartData} />
                      <div className="flex justify-between mt-4 text-sm text-muted-foreground">
                        <span>10</span>
                        <span>10</span>
                        <span>10</span>
                        <span>10</span>
                        <span>10</span>
                        <span>Today</span>
                        <span>10</span>
                        <span>10</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="space-y-4">
                  <MetricCard
                    title="Current Monthly Active Users"
                    value={120}
                    subtitle="200 Total"
                    trend="up"
                    trendValue="+13%"
                  />
                  <MetricCard
                    title="ROI per seat"
                    value="0.6"
                    trend="down"
                    trendValue="-0.4"
                  />
                </div>
              </div>

              {/* Activity Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ActivitySection />
              </div>
            </TabsContent>

            <TabsContent value="security-deployments" className="space-y-6">
              {/* Security and Deployments Combined */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SecuritySection />
                
                {/* Deployments Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <Rocket className="w-5 h-5" />
                      Recent Deployments
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4 text-xs font-medium text-muted-foreground pb-2 border-b">
                        <div>App</div>
                        <div>Status</div>
                        <div>Deployed</div>
                      </div>
                      
                      {[
                        { app: 'chat-app', status: 'Live', time: '2 hours ago', statusColor: 'bg-green-500' },
                        { app: 'todo-manager', status: 'Live', time: '1 day ago', statusColor: 'bg-green-500' },
                        { app: 'weather-widget', status: 'Building', time: '5 minutes ago', statusColor: 'bg-yellow-500' },
                        { app: 'portfolio-site', status: 'Failed', time: '3 days ago', statusColor: 'bg-red-500' }
                      ].map((deployment, index) => (
                        <div key={index} className="grid grid-cols-3 gap-4 items-center py-2">
                          <div className="font-medium text-sm">{deployment.app}</div>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 ${deployment.statusColor} rounded-full`}></div>
                            <span className="text-sm">{deployment.status}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">{deployment.time}</div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-green-600">12</div>
                          <div className="text-xs text-muted-foreground">Successful</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-yellow-600">2</div>
                          <div className="text-xs text-muted-foreground">In Progress</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-red-600">1</div>
                          <div className="text-xs text-muted-foreground">Failed</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}