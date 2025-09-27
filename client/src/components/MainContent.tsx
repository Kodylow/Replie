import { useState } from 'react'
import { ArrowRight, Globe, Database, Gamepad2, Layers, Bot } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import CategoryButton from './CategoryButton'
import ProjectCard from './ProjectCard'

const categories = [
  { id: 'web', label: 'Web app', icon: <Globe className="w-4 h-4" /> },
  { id: 'data', label: 'Data app', icon: <Database className="w-4 h-4" /> },
  { id: 'game', label: '3D Game', icon: <Gamepad2 className="w-4 h-4" /> },
  { id: 'general', label: 'General', icon: <Layers className="w-4 h-4" /> },
  { id: 'agents', label: 'Agents & Automations', icon: <Bot className="w-4 h-4" />, badge: 'Beta' },
]

// TODO: Remove mock data when building real functionality
const recentApps = [
  {
    id: 1,
    title: 'CashflowRetro',
    description: 'Waiting for you',
    timeAgo: '29 hours ago',
    isPrivate: true,
    backgroundColor: 'bg-gradient-to-br from-orange-400 to-red-500'
  },
  {
    id: 2,
    title: 'StrikeAutoPilot',
    timeAgo: '1 day ago',
    isPrivate: true,
    backgroundColor: 'bg-gradient-to-br from-gray-700 to-gray-900'
  },
  {
    id: 3,
    title: 'OmnicronPitch',
    timeAgo: '3 days ago',
    isPrivate: true,
    backgroundColor: 'bg-gradient-to-br from-blue-500 to-purple-600'
  }
]

export default function MainContent() {
  const [projectIdea, setProjectIdea] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('web')

  const handleStartChat = () => {
    if (projectIdea.trim()) {
      console.log('Starting chat with idea:', projectIdea)
      console.log('Selected category:', selectedCategory)
      // TODO: Remove mock functionality - integrate with real project creation
    }
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Greeting */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-foreground mb-6">
            Hi Kody, what do you want to make?
          </h1>
          
          {/* Project Idea Input */}
          <div className="relative max-w-2xl mx-auto mb-6">
            <Input
              placeholder="Describe the idea you want to build..."
              value={projectIdea}
              onChange={(e) => setProjectIdea(e.target.value)}
              className="pr-12 h-12 text-base"
              data-testid="input-project-idea"
            />
            <Button
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8"
              onClick={handleStartChat}
              disabled={!projectIdea.trim()}
              data-testid="button-start-chat"
            >
              Start chat
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          
          {/* Auto Theme Toggle */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <Button 
              variant="ghost" 
              size="sm"
              className="text-sm text-muted-foreground"
              data-testid="button-auto-theme"
            >
              Auto theme
            </Button>
          </div>
          
          {/* Categories */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {categories.map((category) => (
              <CategoryButton
                key={category.id}
                label={category.label}
                icon={category.icon}
                badge={category.badge}
                active={selectedCategory === category.id}
                onClick={() => {
                  setSelectedCategory(category.id)
                  console.log('Selected category:', category.id)
                }}
              />
            ))}
          </div>
        </div>
        
        {/* Recent Apps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Recent Apps</h2>
            <Button 
              variant="ghost" 
              size="sm"
              className="text-sm text-muted-foreground"
              data-testid="button-view-all"
              onClick={() => console.log('View all clicked')}
            >
              View All
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentApps.map((app) => (
              <ProjectCard
                key={app.id}
                title={app.title}
                description={app.description}
                timeAgo={app.timeAgo}
                isPrivate={app.isPrivate}
                backgroundColor={app.backgroundColor}
                onClick={() => console.log(`Opening app: ${app.title}`)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}