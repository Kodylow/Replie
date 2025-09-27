import { useState } from 'react'
import { useLocation } from 'wouter'
import { ArrowRight, Globe, Database, Gamepad2, Layers, Bot, Paperclip, Mic, Link } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/useAuth'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { useMutation } from '@tanstack/react-query'
import { apiRequest } from '@/lib/queryClient'
import { useToast } from '@/hooks/use-toast'
import type { InsertProject } from '@shared/schema'

const categories = [
  { id: 'web', label: 'Web app', icon: <Globe className="w-4 h-4" /> },
  { id: 'data', label: 'Data app', icon: <Database className="w-4 h-4" /> },
  { id: 'game', label: '3D Game', icon: <Gamepad2 className="w-4 h-4" /> },
  { id: 'general', label: 'General', icon: <Layers className="w-4 h-4" /> },
  { id: 'agents', label: 'Agents & Automations', icon: <Bot className="w-4 h-4" />, badge: 'Beta' },
]

const backgroundColors = [
  'bg-gradient-to-br from-orange-400 to-red-500',
  'bg-gradient-to-br from-gray-700 to-gray-900',
  'bg-gradient-to-br from-blue-500 to-purple-600',
  'bg-gradient-to-br from-green-400 to-blue-500',
  'bg-gradient-to-br from-purple-400 to-pink-500',
  'bg-gradient-to-br from-yellow-400 to-orange-500',
]

function getRandomBackgroundColor(): string {
  return backgroundColors[Math.floor(Math.random() * backgroundColors.length)]
}

export default function MobileCreateTab() {
  const [, setLocation] = useLocation()
  const [projectIdea, setProjectIdea] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('web')
  const { user } = useAuth()
  const { currentWorkspace } = useWorkspace()
  const { toast } = useToast()

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (projectData: Omit<InsertProject, 'workspaceId'>) => {
      if (!currentWorkspace) throw new Error('No workspace selected')
      const response = await apiRequest('POST', `/api/workspaces/${currentWorkspace.id}/projects`, projectData)
      return await response.json()
    },
    onSuccess: () => {
      setProjectIdea('')
      toast({
        title: 'Project created!',
        description: 'Your new project has been created successfully.'
      })
      // Navigate to planning page for full experience
      console.log('About to navigate to planning page')
      setLocation('/planning')
      console.log('Navigation called for /planning')
    },
    onError: (error) => {
      console.error('Error creating project:', error)
      toast({
        title: 'Error',
        description: 'Failed to create project. Please try again.',
        variant: 'destructive'
      })
    }
  })

  const handleStartChat = () => {
    if (projectIdea.trim()) {
      const projectData: Omit<InsertProject, 'workspaceId'> = {
        title: projectIdea.trim(),
        description: `A ${categories.find(c => c.id === selectedCategory)?.label.toLowerCase()} project`,
        category: selectedCategory,
        isPrivate: 'true',
        backgroundColor: getRandomBackgroundColor()
      }
      
      createProjectMutation.mutate(projectData)
    }
  }

  return (
    <div className="flex-1 overflow-auto pb-20"> {/* pb-20 for bottom nav space */}
      <div className="px-4 py-6">
        {/* Greeting */}
        <div className="text-center mb-8">
          <h1 className="text-xl font-semibold text-foreground mb-6">
            {`Hi ${user?.firstName || 'there'}, what do you want to make?`}
          </h1>
          
          {/* Project Idea Input */}
          <div className="mb-6">
            <div className="border border-border rounded-lg bg-background">
              <Textarea
                placeholder="Describe the idea you want to build..."
                value={projectIdea}
                onChange={(e) => setProjectIdea(e.target.value)}
                className="min-h-[120px] resize-none border-0 bg-transparent text-base focus-visible:ring-0 p-4"
                data-testid="mobile-project-idea-input"
              />
              
              {/* Category Pills */}
              <div className="px-4 pb-3">
                <div className="flex gap-2 overflow-x-auto">
                  {categories.slice(0, 3).map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setSelectedCategory(category.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm shrink-0 transition-colors border ${
                        selectedCategory === category.id
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background text-foreground border-border hover:bg-accent'
                      }`}
                      data-testid={`mobile-category-${category.id}`}
                      aria-pressed={selectedCategory === category.id}
                    >
                      {category.icon}
                      <span className="font-medium">{category.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Bottom Controls */}
              <div className="flex items-center justify-between px-3 py-2 border-t border-border">
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-8 w-8"
                    data-testid="mobile-attach-button"
                  >
                    <Paperclip className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-8 w-8"
                    data-testid="mobile-mic-button"
                  >
                    <Mic className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-8 w-8"
                    data-testid="mobile-link-button"
                  >
                    <Link className="w-4 h-4" />
                  </Button>
                </div>
                
                <Button
                  size="sm"
                  onClick={() => {
                    // For now, navigate directly to planning without creating project
                    console.log('Navigating directly to planning')
                    try {
                      setLocation('/planning')
                      console.log('setLocation called successfully')
                      // Fallback navigation if wouter fails
                      setTimeout(() => {
                        if (window.location.pathname !== '/planning') {
                          console.log('Fallback: using window.location')
                          window.location.href = '/planning'
                        }
                      }, 100)
                    } catch (error) {
                      console.error('Navigation error:', error)
                      window.location.href = '/planning'
                    }
                  }}
                  disabled={!projectIdea.trim()}
                  data-testid="mobile-start-chat-button"
                  className="flex items-center gap-2 h-8"
                >
                  Start chat
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}