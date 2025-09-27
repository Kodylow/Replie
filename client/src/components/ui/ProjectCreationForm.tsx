import { useState } from 'react';
import { Paperclip, Link, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CategorySelector } from './CategorySelector';
import { categories, getRandomBackgroundColor, type CategoryId } from '@/lib/utils/projectUtils';
import { useProjectManagement } from '@/hooks/useProjectManagement';
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
  const { createProject, isCreating } = useProjectManagement();

  const handleStartChat = async () => {
    if (!projectIdea.trim()) return;

    const projectData: Omit<InsertProject, 'workspaceId'> = {
      title: projectIdea.trim(),
      description: `A ${categories.find(c => c.id === selectedCategory)?.label.toLowerCase()} project`,
      category: selectedCategory,
      isPrivate: 'true',
      backgroundColor: getRandomBackgroundColor()
    };
    
    try {
      await createProject.mutateAsync(projectData);
      setProjectIdea('');
      onProjectCreated?.();
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Project Idea Input */}
      <div className="relative border border-border rounded-lg bg-background focus-within:border-primary">
        <Textarea
          placeholder="Describe the idea you want to build..."
          value={projectIdea}
          onChange={(e) => setProjectIdea(e.target.value)}
          className="min-h-[100px] resize-none border-0 bg-transparent text-base focus-visible:ring-0 p-4"
          data-testid="input-project-idea"
        />
        
        {/* Bottom Controls */}
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-3">
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
              disabled={!projectIdea.trim() || isCreating}
              data-testid="button-start-chat"
              className="flex items-center gap-2 h-8"
            >
              {isCreating ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                'Start chat'
              )}
            </Button>
            
          </div>
          
        </div>
        {/* Inline Category Selector (inside bordered container) */}
        <div className="px-3 pb-2">
          <CategorySelector 
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />
        </div>
      </div>
    </div>
  );
}