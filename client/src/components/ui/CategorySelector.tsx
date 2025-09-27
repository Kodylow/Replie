import { Globe, Database, Gamepad2, Layers, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { categories, type CategoryId } from '@/lib/utils/projectUtils';

interface CategorySelectorProps {
  selectedCategory: CategoryId;
  onCategoryChange: (category: CategoryId) => void;
}

const categoryIcons = {
  web: Globe,
  data: Database,
  game: Gamepad2,
  general: Layers,
  agents: Bot,
} as const;

/**
 * Category selection component for project creation
 */
export function CategorySelector({ selectedCategory, onCategoryChange }: CategorySelectorProps) {
  return (
    <div className="flex flex-nowrap gap-2 overflow-x-auto">
      {categories.map((category) => {
        const IconComponent = categoryIcons[category.id];
        const isSelected = selectedCategory === category.id;
        
        return (
          <Button
            key={category.id}
            variant={isSelected ? "ghost" : "outline"}
            size="sm"
            onClick={() => onCategoryChange(category.id)}
            className="flex items-center gap-2 shrink-0"
            data-testid={`category-${category.id}`}
          >
            <IconComponent className="w-4 h-4" />
            {category.label}
            {'badge' in category && category.badge && (
              <Badge variant="secondary" className="text-xs">
                {category.badge}
              </Badge>
            )}
          </Button>
        );
      })}
    </div>
  );
}