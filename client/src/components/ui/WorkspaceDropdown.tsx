import { ChevronDown, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useWorkspace } from '@/contexts/WorkspaceContext';

interface WorkspaceDropdownProps {
  onCreateTeam?: () => void;
}

/**
 * Workspace selection dropdown component
 */
export function WorkspaceDropdown({ onCreateTeam }: WorkspaceDropdownProps) {
  const { workspaces, currentWorkspace, setCurrentWorkspace } = useWorkspace();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="flex items-center gap-2 text-sm font-medium bg-sidebar hover:bg-sidebar-accent rounded-full px-3 py-2 h-8"
          data-testid="button-workspace-dropdown"
        >
          <div className="w-5 h-5 bg-primary rounded-sm flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xs">
              {currentWorkspace?.name.charAt(0).toUpperCase() || 'R'}
            </span>
          </div>
          {currentWorkspace?.type === 'personal' 
            ? 'Personal Workspace' 
            : `${currentWorkspace?.name} Workspace` || 'Loading workspace...'}
          <ChevronDown className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center">
        {workspaces.map((workspace) => (
          <DropdownMenuItem
            key={workspace.id}
            onClick={() => setCurrentWorkspace(workspace)}
            className={workspace.id === currentWorkspace?.id ? 'bg-accent' : ''}
            data-testid={`workspace-${workspace.slug}`}
          >
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-primary rounded-sm flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xs">
                  {workspace.name.charAt(0).toUpperCase()}
                </span>
              </div>
              {workspace.type === 'personal' 
                ? 'Personal Workspace' 
                : `${workspace.name} Workspace`}
              <span className="text-muted-foreground text-xs ml-auto">({workspace.type})</span>
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onCreateTeam}
          data-testid="button-create-team"
        >
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Team
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}