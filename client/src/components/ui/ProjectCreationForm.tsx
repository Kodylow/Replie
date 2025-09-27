import { useState } from 'react';
import { useLocation } from 'wouter';
import { Paperclip, Link, ChevronDown, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CategorySelector } from './CategorySelector';
import { categories, getRandomBackgroundColor, type CategoryId } from '@/lib/utils/projectUtils';
import { useProjectManagement } from '@/hooks/useProjectManagement';
import { useToast } from '@/hooks/use-toast';
import type { InsertProject } from '@shared/schema';

interface ProjectCreationFormProps {
  onProjectCreated?: () => void;
}

/**
 * Project creation form component with idea input and category selection
 */
export function ProjectCreationForm({ onProjectCreated }: ProjectCreationFormProps) {
  const [projectIdea, setProjectIdea] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('web');
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleStartChat = () => {
    if (!projectIdea.trim()) return;

    const encodedIdea = encodeURIComponent(projectIdea.trim());
    setProjectIdea('');
    toast({
      title: 'Starting planning session...',
      description: 'Let me help you plan your project.'
    });
    // Navigate to planning page with project idea
    setLocation(`/planning?idea=${encodedIdea}`);
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Project Idea Input */}
      <div className="border border-border rounded-lg overflow-hidden focus-within:border-primary">
        <div className="rounded-lg bg-background">
            <Textarea
              placeholder="Describe the idea you want to build..."
              value={projectIdea}
              onChange={(e) => setProjectIdea(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                  e.preventDefault();
                  if (projectIdea.trim()) {
                    handleStartChat();
                  }
                }
              }}
              className="min-h-[100px] resize-none border-0 bg-transparent text-base focus-visible:ring-0 p-4 rounded-none"
              data-testid="input-project-idea"
            />
        </div>

        {/* Bottom Controls */}
        <div className="rounded-lg bg-background">
          <div className="flex items-center justify-between px-3 py-2">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="sm"
                className="p-1.5 h-7 w-7"
                data-testid="button-attach"
              >
                <Paperclip className="w-4 h-4" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm"
                className="flex items-center gap-1 text-sm text-muted-foreground h-7 px-2"
                data-testid="button-auto-theme"
              >
                Auto theme
                <ChevronDown className="w-3 h-3" />
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm"
                className="p-1.5 h-7 w-7"
                data-testid="button-link"
              >
                <Link className="w-4 h-4" />
              </Button>
              
              <Button
                size="sm"
                onClick={handleStartChat}
                disabled={!projectIdea.trim()}
                data-testid="button-start-chat"
                className="flex items-center gap-2 h-8"
              >
                <Send className="w-4 h-4" />
                Start chat
              </Button>
              
            </div>
            
          </div>
          
          {/* Inline Category Selector (separate from bordered input) */}
          <div className="px-3 pb-2">
            <CategorySelector 
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
            />
          </div>
        </div>
      </div>
    </div>
  );
}