# Contributing to Replit Workspace Clone

Thank you for your interest in contributing to the Replit Workspace Clone! This project is designed to be a playground for exploring new Replit features and development workflows. Whether you're fixing bugs, adding features, or improving documentation, your contributions are welcome.

## Table of Contents

- [Quick Start](#quick-start)
- [Development Environment Setup](#development-environment-setup)
- [Project Architecture](#project-architecture)
- [Code Style and Conventions](#code-style-and-conventions)
- [Component Design Principles](#component-design-principles)
- [API Design Patterns](#api-design-patterns)
- [Database Guidelines](#database-guidelines)
- [Testing Guidelines](#testing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)
- [Feature Development Patterns](#feature-development-patterns)

## Quick Start

The fastest way to contribute is through Replit's remix feature:

1. **[Remix the project →](https://replit.com/@kodylow/ReplitPrototyper?v=1)**
2. Make your changes in the remixed Repl
3. Test your changes thoroughly
4. Publish your Repl and share the link
5. Submit feedback or create a pull request

## Development Environment Setup

### Prerequisites

- **Node.js 20+** - Latest LTS version recommended
- **PostgreSQL** - Local instance or cloud database
- **Replit Account** - For OAuth authentication
- **OpenAI API Key** - Optional, for AI features
- **Google Cloud Storage** - Optional, for file storage

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-repo/replit-workspace-clone.git
   cd replit-workspace-clone
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Create a `.env` file:
   ```bash
   # Required
   DATABASE_URL=postgresql://username:password@localhost:5432/replit_clone
   SESSION_SECRET=your_super_secret_session_key
   
   # Authentication (for full functionality)
   REPLIT_CLIENT_ID=your_replit_oauth_client_id
   REPLIT_CLIENT_SECRET=your_replit_oauth_client_secret
   
   # Optional features
   OPENAI_API_KEY=your_openai_api_key
   PUBLIC_OBJECT_SEARCH_PATHS=/bucket-name/public
   PRIVATE_OBJECT_DIR=/bucket-name/.private
   ```

4. **Set up the database**
   ```bash
   npm run db:push
   ```

5. **Start development**
   ```bash
   npm run dev
   ```

### Development Tools

- **VS Code** recommended with these extensions:
  - TypeScript and JavaScript Language Features
  - Tailwind CSS IntelliSense
  - ESLint
  - Prettier
  - Thunder Client (for API testing)

## Project Architecture

### Frontend Architecture

The frontend follows a modern React architecture with these key principles:

#### **Component Structure**
```
client/src/components/
├── ui/                 # shadcn/ui base components
├── examples/           # Component usage examples
├── Header.tsx          # Main application header
├── Sidebar.tsx         # Desktop navigation sidebar
├── MobileBottomNav.tsx # Mobile navigation
├── ProjectCard.tsx     # Project display cards
└── ...                 # Feature-specific components
```

#### **Page Organization**
```
client/src/pages/
├── Home.tsx           # Dashboard home page
├── Projects.tsx       # Project management
├── Apps.tsx           # Application management
├── Editor.tsx         # Code editor interface
├── Planning.tsx       # AI planning interface
├── Import.tsx         # Import workflows
└── ...                # Additional pages
```

#### **State Management**
- **TanStack Query** for server state and caching
- **React Context** for global application state
- **Local state** with hooks for component state

### Backend Architecture

#### **API Structure**
```
server/
├── routes.ts          # All API endpoints
├── storage.ts         # Database abstraction layer
├── replitAuth.ts      # Authentication middleware
├── objectStorage.ts   # File storage service
└── vite.ts           # Development server setup
```

#### **Database Layer**
- **Drizzle ORM** for type-safe database operations
- **PostgreSQL** as the primary database
- **Schema-first approach** with shared types

### Key Architectural Decisions

1. **Shared Types** - All database schemas and validation logic in `shared/schema.ts`
2. **API-First Design** - Clean separation between frontend and backend
3. **Mobile-First Responsive** - Progressive enhancement for larger screens
4. **Component Composition** - Prefer composition over inheritance
5. **Type Safety** - Strict TypeScript throughout the application

## Code Style and Conventions

### TypeScript Guidelines

```typescript
// ✅ Use explicit return types for functions
export async function getUserProjects(userId: string): Promise<Project[]> {
  return await storage.getWorkspaceProjects(userId);
}

// ✅ Use proper error handling
try {
  const result = await apiCall();
  return result;
} catch (error) {
  console.error('Operation failed:', error);
  throw new Error('Failed to complete operation');
}

// ✅ Use type guards when necessary
function isProject(item: Project | App): item is Project {
  return 'deploymentStatus' in item;
}
```

### React Component Patterns

```tsx
// ✅ Use proper component structure
interface ProjectCardProps {
  project: Project;
  onEdit?: (project: Project) => void;
  onDelete?: (projectId: string) => void;
}

export default function ProjectCard({ 
  project, 
  onEdit, 
  onDelete 
}: ProjectCardProps) {
  const handleEdit = () => {
    onEdit?.(project);
  };

  return (
    <Card className="hover-elevate" data-testid={`card-project-${project.id}`}>
      <CardContent>
        <h3 className="font-semibold">{project.title}</h3>
        {project.description && (
          <p className="text-muted-foreground">{project.description}</p>
        )}
      </CardContent>
    </Card>
  );
}
```

### CSS and Styling

```tsx
// ✅ Use Tailwind utility classes
<div className="flex items-center gap-4 p-6 bg-card rounded-lg border">
  
// ✅ Use design system tokens
<Button variant="outline" size="sm">
  
// ✅ Include dark mode variants when needed
<div className="bg-white dark:bg-gray-900 text-black dark:text-white">

// ✅ Add hover states with utility classes
<Card className="hover-elevate active-elevate-2">
```

### File Naming Conventions

- **React Components** - PascalCase (e.g., `ProjectCard.tsx`)
- **Hooks** - camelCase with `use` prefix (e.g., `useAuth.ts`)
- **Utilities** - camelCase (e.g., `queryClient.ts`)
- **Pages** - PascalCase (e.g., `Home.tsx`)
- **Types** - PascalCase interfaces (e.g., `interface UserProfile`)

## Component Design Principles

### shadcn/ui Usage

Always use the existing shadcn/ui components:

```tsx
// ✅ Use existing components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// ❌ Don't create custom styled divs
<div className="bg-primary text-primary-foreground px-4 py-2 rounded">
```

### Accessibility Guidelines

```tsx
// ✅ Include data-testid for interactive elements
<Button data-testid="button-save-project" onClick={handleSave}>
  Save Project
</Button>

// ✅ Use semantic HTML elements
<main className="container mx-auto">
  <section aria-labelledby="projects-heading">
    <h2 id="projects-heading">Your Projects</h2>
  </section>
</main>

// ✅ Provide proper ARIA labels
<input 
  aria-label="Search projects"
  placeholder="Search your projects..."
/>
```

### Responsive Design Patterns

```tsx
// ✅ Mobile-first responsive design
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// ✅ Hide elements on mobile when appropriate
<div className="hidden md:flex items-center gap-2">

// ✅ Use different layouts for mobile
const isMobile = useIsMobile();
return isMobile ? <MobileLayout /> : <DesktopLayout />;
```

## API Design Patterns

### RESTful Endpoint Structure

```typescript
// ✅ Follow RESTful conventions
GET    /api/workspaces/:id/projects        # List projects
POST   /api/workspaces/:id/projects        # Create project
GET    /api/projects/:id                   # Get project
PATCH  /api/projects/:id                   # Update project
DELETE /api/projects/:id                   # Delete project
```

### Request/Response Patterns

```typescript
// ✅ Use Zod for validation
app.post('/api/projects', async (req, res) => {
  try {
    const validatedData = insertProjectSchema.parse(req.body);
    const project = await storage.createProject(validatedData);
    res.status(201).json(project);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

### Error Handling

```typescript
// ✅ Consistent error responses
interface ApiError {
  error: string;
  details?: any;
  code?: string;
}

// ✅ Proper error status codes
if (!project) {
  return res.status(404).json({ error: 'Project not found' });
}

if (!hasPermission) {
  return res.status(403).json({ error: 'Access denied' });
}
```

## Database Guidelines

### Schema Design Principles

```typescript
// ✅ Define schemas with proper constraints
export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id").notNull(), // Foreign key
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(), // Use text for enums
  isPrivate: text("is_private").notNull().default('true'), // String booleans
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});
```

### Type Generation

```typescript
// ✅ Generate proper insert and select types
export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;
```

### Storage Interface

```typescript
// ✅ Define clear interface methods
export interface IStorage {
  // Project methods
  getProject(id: string): Promise<Project | undefined>;
  getWorkspaceProjects(workspaceId: string): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, updates: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: string): Promise<boolean>;
  searchProjects(workspaceId: string, query: string): Promise<Project[]>;
}
```

## Testing Guidelines

### Component Testing

```tsx
// ✅ Test user interactions
test('should handle project editing', async () => {
  const handleEdit = jest.fn();
  render(<ProjectCard project={mockProject} onEdit={handleEdit} />);
  
  const editButton = screen.getByTestId('button-edit-project');
  await user.click(editButton);
  
  expect(handleEdit).toHaveBeenCalledWith(mockProject);
});
```

### API Testing

```typescript
// ✅ Test API endpoints
test('POST /api/projects should create a new project', async () => {
  const projectData = {
    workspaceId: 'workspace-1',
    title: 'Test Project',
    category: 'web',
  };
  
  const response = await request(app)
    .post('/api/projects')
    .send(projectData)
    .expect(201);
    
  expect(response.body).toMatchObject(projectData);
});
```

## Pull Request Process

### Before Submitting

1. **Test thoroughly**
   - Manual testing on desktop and mobile
   - Verify database operations work
   - Check authentication flows
   - Test error scenarios

2. **Code quality checks**
   ```bash
   npm run check      # TypeScript compilation
   npm run build      # Production build
   ```

3. **Review the changes**
   - Ensure changes match the project's design system
   - Verify responsive design works
   - Check accessibility features

### PR Template

When submitting a pull request, include:

```markdown
## Description
Brief description of what this PR does.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tested on desktop browsers
- [ ] Tested on mobile devices
- [ ] Manual testing completed
- [ ] No console errors

## Screenshots
Include screenshots for UI changes.

## Checklist
- [ ] Code follows the style guidelines
- [ ] Self-review completed
- [ ] Changes are well documented
- [ ] No breaking changes (or documented)
```

### Review Criteria

Pull requests are evaluated on:

- **Functionality** - Does it work as intended?
- **Code Quality** - Is it well-structured and maintainable?
- **Design Consistency** - Does it match the design system?
- **Performance** - Are there any performance implications?
- **Accessibility** - Is it accessible to all users?
- **Mobile Experience** - Does it work well on mobile devices?

## Issue Reporting

### Bug Reports

When reporting bugs, include:

```markdown
## Bug Description
Clear description of what went wrong.

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. See error

## Expected Behavior
What you expected to happen.

## Actual Behavior
What actually happened.

## Environment
- Browser: [e.g., Chrome 91]
- Device: [e.g., iPhone 12, Desktop]
- Screen size: [e.g., 1920x1080, 375x667]

## Screenshots
Include screenshots if applicable.
```

### Feature Requests

For new features:

```markdown
## Feature Description
Clear description of the proposed feature.

## Use Case
Why is this feature needed? What problem does it solve?

## Proposed Solution
How should this feature work?

## Alternative Solutions
Any alternative approaches considered?

## Additional Context
Any other context, mockups, or examples.
```

## Feature Development Patterns

### AI Integration

When adding AI features:

```typescript
// ✅ Handle AI API calls properly
const chatMutation = useMutation({
  mutationFn: async (message: string) => {
    const response = await apiRequest('POST', '/api/chat/planning', {
      message,
      conversationId,
      workspaceId: currentWorkspace?.id,
    });
    return await response.json();
  },
  onError: (error) => {
    toast({
      title: 'AI service unavailable',
      description: 'Please try again later.',
      variant: 'destructive',
    });
  },
});
```

### Object Storage Integration

```typescript
// ✅ Handle file operations with proper error handling
const uploadFileMutation = useMutation({
  mutationFn: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('Upload failed');
    }
    
    return response.json();
  },
});
```

### Mobile-Specific Features

```tsx
// ✅ Implement mobile-specific patterns
export default function MobileCreateTab() {
  const [selectedCategory, setSelectedCategory] = useState('web');
  
  return (
    <div className="h-full overflow-y-auto pb-20"> {/* Account for bottom nav */}
      <div className="p-4 space-y-6">
        {/* Mobile-optimized content */}
      </div>
    </div>
  );
}
```

## Advanced Development Topics

### Performance Optimization

```tsx
// ✅ Use React.memo for expensive components
export default memo(function ProjectCard({ project }: ProjectCardProps) {
  // Component implementation
});

// ✅ Optimize queries with proper keys
const { data: projects } = useQuery({
  queryKey: ['/api/workspaces', workspaceId, 'projects'],
  queryFn: () => fetchProjects(workspaceId),
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

### Error Boundaries

```tsx
// ✅ Implement error boundaries for robustness
class ProjectErrorBoundary extends Component {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Project component error:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <ProjectErrorFallback />;
    }
    return this.props.children;
  }
}
```

### Internationalization Preparation

```tsx
// ✅ Structure code for future i18n support
const messages = {
  projectCreated: 'Project created successfully',
  projectDeleted: 'Project deleted',
  errorOccurred: 'An error occurred',
};

// Use consistent message keys
toast({ title: messages.projectCreated });
```

## Getting Help

- **Documentation** - Check the README and existing documentation first
- **Code Examples** - Look at existing components for patterns
- **Issues** - Search existing issues before creating new ones
- **Discussions** - Use GitHub Discussions for questions and ideas
- **Replit Community** - Share your work with the broader community

## Conclusion

This project is a collaborative space for exploring new ideas and improvements for Replit. Every contribution, whether big or small, helps make the development experience better for everyone. Thank you for contributing!

---

**Ready to contribute?** [Remix the project →](https://replit.com/@kodylow/ReplitPrototyper?v=1) and start building!