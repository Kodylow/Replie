import { type User, type UpsertUser, type InsertUser, type Project, type InsertProject, type App, type InsertApp, type Workspace, type InsertWorkspace, type WorkspaceMember, type InsertWorkspaceMember, type WorkspaceMemberWithUser, type Template, type InsertTemplate, type ChatConversation, type InsertChatConversation, type ChatMessage, type InsertChatMessage } from "@shared/schema";
import { randomUUID } from "crypto";
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { users, workspaces, workspaceMembers, projects, apps, templates, chatConversations, chatMessages } from "@shared/schema";
import { eq, and, or, ilike, desc } from 'drizzle-orm';

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User methods (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<{ firstName: string; lastName: string; bio: string }>): Promise<User | undefined>;
  
  // Workspace methods
  getWorkspace(id: string): Promise<Workspace | undefined>;
  getUserWorkspaces(userId: string): Promise<Workspace[]>;
  createWorkspace(workspace: InsertWorkspace): Promise<Workspace>;
  updateWorkspace(id: string, workspace: Partial<InsertWorkspace>): Promise<Workspace | undefined>;
  deleteWorkspace(id: string): Promise<boolean>;
  getDefaultWorkspace(userId: string): Promise<Workspace | undefined>;
  
  // Workspace membership methods
  addWorkspaceMember(member: InsertWorkspaceMember): Promise<WorkspaceMember>;
  removeWorkspaceMember(workspaceId: string, userId: string): Promise<boolean>;
  getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]>;
  getWorkspaceMembersWithUsers(workspaceId: string): Promise<WorkspaceMemberWithUser[]>;
  isWorkspaceMember(workspaceId: string, userId: string): Promise<boolean>;
  
  // Project methods (workspace-scoped)
  getProject(id: string): Promise<Project | undefined>;
  getWorkspaceProjects(workspaceId: string): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, project: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: string): Promise<boolean>;
  searchProjects(workspaceId: string, query: string): Promise<Project[]>;
  
  // App methods (workspace-scoped)
  getApp(id: string): Promise<App | undefined>;
  getWorkspaceApps(workspaceId: string): Promise<App[]>;
  createApp(app: InsertApp): Promise<App>;
  updateApp(id: string, app: Partial<InsertApp>): Promise<App | undefined>;
  deleteApp(id: string): Promise<boolean>;
  searchApps(workspaceId: string, query: string): Promise<App[]>;
  
  // Template methods
  getTemplate(id: string): Promise<Template | undefined>;
  getAllTemplates(): Promise<Template[]>;
  getTemplatesByCategory(category: string): Promise<Template[]>;
  searchTemplates(query: string, category?: string): Promise<Template[]>;
  incrementTemplateUsage(id: string): Promise<void>;
  
  // Chat conversation methods
  getChatConversation(id: string): Promise<ChatConversation | undefined>;
  getUserChatConversations(userId: string): Promise<ChatConversation[]>;
  createChatConversation(conversation: InsertChatConversation): Promise<ChatConversation>;
  updateChatConversation(id: string, conversation: Partial<InsertChatConversation>): Promise<ChatConversation | undefined>;
  deleteChatConversation(id: string): Promise<boolean>;
  
  // Chat message methods
  getChatMessage(id: string): Promise<ChatMessage | undefined>;
  getConversationMessages(conversationId: string): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  deleteChatMessage(id: string): Promise<boolean>;
  
  // App file management methods
  initializeAppFiles(appId: string, objectStoragePath: string): Promise<boolean>;
  updateAppObjectStoragePath(appId: string, objectStoragePath: string): Promise<App | undefined>;
  
  // User sample data creation
  createUserSampleData(workspaceId: string, userName: string, userId: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private workspaces: Map<string, Workspace>;
  private workspaceMembers: Map<string, WorkspaceMember>;
  private projects: Map<string, Project>;
  private apps: Map<string, App>;
  private templates: Map<string, Template>;
  private chatConversations: Map<string, ChatConversation>;
  private chatMessages: Map<string, ChatMessage>;

  constructor() {
    this.users = new Map();
    this.workspaces = new Map();
    this.workspaceMembers = new Map();
    this.projects = new Map();
    this.apps = new Map();
    this.templates = new Map();
    this.chatConversations = new Map();
    this.chatMessages = new Map();
    
    // Initialize templates only
    this.initializeTemplates();
  }


  private async initializeTemplates() {
    // Essential template data covering different categories
    const sampleTemplates = [
      // Essential templates covering different categories
      {
        title: "React TypeScript Starter",
        description: "A modern React application with TypeScript, Tailwind CSS, and Vite for fast development",
        category: "web",
        tags: ["React", "TypeScript", "Tailwind CSS", "Vite"],
        backgroundColor: "bg-gradient-to-br from-blue-500 to-cyan-600",
        iconName: "Globe",
        usageCount: "2847",
        difficulty: "beginner",
        estimatedTime: "15 minutes",
        fileStructure: {
          "src/": "React components and application code",
          "public/": "Static assets and HTML template"
        },
        isOfficial: "true"
      },
      {
        title: "Python Data Analysis",
        description: "Jupyter notebook environment for data analysis with pandas, numpy, and matplotlib",
        category: "data",
        tags: ["Python", "Jupyter", "Pandas", "NumPy", "Matplotlib"],
        backgroundColor: "bg-gradient-to-br from-yellow-500 to-orange-600",
        iconName: "BarChart3",
        usageCount: "1654",
        difficulty: "beginner",
        estimatedTime: "20 minutes",
        fileStructure: {
          "notebooks/": "Jupyter notebooks for analysis",
          "data/": "Sample datasets"
        },
        isOfficial: "true"
      },
      {
        title: "JavaScript Game Engine",
        description: "2D game framework with HTML5 Canvas, sprite animation, and collision detection",
        category: "game",
        tags: ["JavaScript", "HTML5 Canvas", "Game Development"],
        backgroundColor: "bg-gradient-to-br from-indigo-600 to-purple-700",
        iconName: "Gamepad2",
        usageCount: "1287",
        difficulty: "intermediate",
        estimatedTime: "1 hour",
        fileStructure: {
          "src/": "Game engine and entity classes",
          "assets/": "Sprites and sound effects"
        },
        isOfficial: "true"
      },
      {
        title: "AI ChatBot Template",
        description: "Intelligent chatbot powered by OpenAI GPT with conversation memory and custom prompts",
        category: "agents",
        tags: ["Python", "OpenAI", "FastAPI", "AI"],
        backgroundColor: "bg-gradient-to-br from-emerald-500 to-teal-600",
        iconName: "Bot",
        usageCount: "1876",
        difficulty: "intermediate",
        estimatedTime: "35 minutes",
        fileStructure: {
          "src/": "ChatBot implementation and API routes",
          "templates/": "Chat interface HTML"
        },
        isOfficial: "true"
      },
      {
        title: "CLI Tool Template",
        description: "Command-line application with argument parsing, configuration, and testing framework",
        category: "general",
        tags: ["Python", "Click", "CLI", "Testing"],
        backgroundColor: "bg-gradient-to-br from-slate-600 to-gray-800",
        iconName: "Terminal",
        usageCount: "943",
        difficulty: "beginner",
        estimatedTime: "25 minutes",
        fileStructure: {
          "src/": "CLI commands and utilities",
          "tests/": "Unit tests and test utilities"
        },
        isOfficial: "true"
      }
    ];

    // Create templates
    for (const templateData of sampleTemplates) {
      const id = randomUUID();
      const now = new Date();
      const template: Template = {
        id,
        title: templateData.title,
        description: templateData.description,
        category: templateData.category as any,
        tags: templateData.tags,
        backgroundColor: templateData.backgroundColor,
        iconName: templateData.iconName,
        usageCount: templateData.usageCount,
        difficulty: templateData.difficulty as any,
        estimatedTime: templateData.estimatedTime,
        fileStructure: templateData.fileStructure,
        isOfficial: templateData.isOfficial as any,
        createdAt: now,
        updatedAt: now,
      };
      this.templates.set(id, template);
    }
  }

  // User methods (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingUser = this.users.get(userData.id!);
    if (existingUser) {
      // Update existing user
      const updatedUser: User = {
        ...existingUser,
        ...userData,
        updatedAt: new Date(),
      };
      this.users.set(userData.id!, updatedUser);
      return updatedUser;
    } else {
      // Create new user
      const now = new Date();
      const newUser: User = {
        id: userData.id || randomUUID(),
        email: userData.email || null,
        firstName: userData.firstName || null,
        lastName: userData.lastName || null,
        bio: "",
        profileImageUrl: userData.profileImageUrl || null,
        createdAt: now,
        updatedAt: now,
      };
      this.users.set(newUser.id, newUser);
      
      // Automatically add new users to existing workspaces for demo purposes
      const allWorkspaces = Array.from(this.workspaces.values());
      for (const workspace of allWorkspaces) {
        try {
          await this.addWorkspaceMember({
            workspaceId: workspace.id,
            userId: newUser.id,
            role: workspace.type === 'personal' ? 'admin' : 'member'
          });
        } catch (error) {
          // Ignore errors if membership already exists
          // Note: User already member of workspace
        }
      }
      
      return newUser;
    }
  }

  async updateUser(id: string, updates: Partial<{ firstName: string; lastName: string; bio: string }>): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) return undefined;

    const updatedUser: User = {
      ...existingUser,
      ...updates,
      updatedAt: new Date(),
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Workspace methods
  async getWorkspace(id: string): Promise<Workspace | undefined> {
    return this.workspaces.get(id);
  }

  async getUserWorkspaces(userId: string): Promise<Workspace[]> {
    const membershipRecords = Array.from(this.workspaceMembers.values())
      .filter(member => member.userId === userId);
    
    const workspaces = membershipRecords
      .map(member => this.workspaces.get(member.workspaceId))
      .filter((workspace): workspace is Workspace => workspace !== undefined)
      .sort((a, b) => {
        // Sort personal workspace first
        if (a.type === 'personal' && b.type !== 'personal') return -1;
        if (b.type === 'personal' && a.type !== 'personal') return 1;
        return a.name.localeCompare(b.name);
      });

    return workspaces;
  }

  async createWorkspace(insertWorkspace: InsertWorkspace): Promise<Workspace> {
    const id = randomUUID();
    const now = new Date();
    const workspace: Workspace = {
      ...insertWorkspace,
      id,
      avatarUrl: insertWorkspace.avatarUrl ?? null,
      description: insertWorkspace.description ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.workspaces.set(id, workspace);
    return workspace;
  }

  async updateWorkspace(id: string, updates: Partial<InsertWorkspace>): Promise<Workspace | undefined> {
    const existing = this.workspaces.get(id);
    if (!existing) return undefined;
    
    const updated: Workspace = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    
    this.workspaces.set(id, updated);
    return updated;
  }

  async deleteWorkspace(id: string): Promise<boolean> {
    // Remove all membership records for this workspace
    const membersToRemove = Array.from(this.workspaceMembers.values())
      .filter(member => member.workspaceId === id);
    
    for (const member of membersToRemove) {
      this.workspaceMembers.delete(member.id);
    }

    return this.workspaces.delete(id);
  }

  async getDefaultWorkspace(userId: string): Promise<Workspace | undefined> {
    const userWorkspaces = await this.getUserWorkspaces(userId);
    return userWorkspaces.find(workspace => workspace.type === 'personal');
  }

  // Workspace membership methods
  async addWorkspaceMember(member: InsertWorkspaceMember): Promise<WorkspaceMember> {
    const id = randomUUID();
    const now = new Date();
    const workspaceMember: WorkspaceMember = {
      ...member,
      id,
      role: member.role || 'member',
      createdAt: now,
    };
    this.workspaceMembers.set(id, workspaceMember);
    return workspaceMember;
  }

  async removeWorkspaceMember(workspaceId: string, userId: string): Promise<boolean> {
    const memberRecord = Array.from(this.workspaceMembers.values())
      .find(member => member.workspaceId === workspaceId && member.userId === userId);
    
    if (memberRecord) {
      return this.workspaceMembers.delete(memberRecord.id);
    }
    
    return false;
  }

  async getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    return Array.from(this.workspaceMembers.values())
      .filter(member => member.workspaceId === workspaceId)
      .sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return aTime - bTime;
      });
  }

  async getWorkspaceMembersWithUsers(workspaceId: string): Promise<WorkspaceMemberWithUser[]> {
    const members = await this.getWorkspaceMembers(workspaceId);
    
    const membersWithUsers: WorkspaceMemberWithUser[] = [];
    
    for (const member of members) {
      const user = this.users.get(member.userId);
      if (user) {
        membersWithUsers.push({
          id: member.id,
          workspaceId: member.workspaceId,
          role: member.role,
          createdAt: member.createdAt || new Date(),
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            profileImageUrl: user.profileImageUrl,
          }
        });
      }
    }
    
    return membersWithUsers;
  }

  async isWorkspaceMember(workspaceId: string, userId: string): Promise<boolean> {
    return Array.from(this.workspaceMembers.values())
      .some(member => member.workspaceId === workspaceId && member.userId === userId);
  }

  // Project methods (workspace-scoped)
  async getProject(id: string): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async getWorkspaceProjects(workspaceId: string): Promise<Project[]> {
    return Array.from(this.projects.values())
      .filter(project => project.workspaceId === workspaceId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = randomUUID();
    const now = new Date();
    const project: Project = {
      ...insertProject,
      id,
      description: insertProject.description ?? null,
      isPrivate: insertProject.isPrivate ?? 'true',
      backgroundColor: insertProject.backgroundColor ?? 'bg-gradient-to-br from-blue-500 to-purple-600',
      deploymentStatus: insertProject.deploymentStatus ?? null,
      importSource: insertProject.importSource ?? null,
      importUrl: insertProject.importUrl ?? null,
      importBranch: insertProject.importBranch ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.projects.set(id, project);
    return project;
  }

  async updateProject(id: string, updates: Partial<InsertProject>): Promise<Project | undefined> {
    const existing = this.projects.get(id);
    if (!existing) return undefined;
    
    const updated: Project = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    
    this.projects.set(id, updated);
    return updated;
  }

  async deleteProject(id: string): Promise<boolean> {
    return this.projects.delete(id);
  }

  async searchProjects(workspaceId: string, query: string): Promise<Project[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.projects.values())
      .filter(project => 
        project.workspaceId === workspaceId &&
        (project.title.toLowerCase().includes(lowercaseQuery) ||
        (project.description && project.description.toLowerCase().includes(lowercaseQuery)) ||
        project.category.toLowerCase().includes(lowercaseQuery))
      )
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  // App methods (workspace-scoped)
  async getApp(id: string): Promise<App | undefined> {
    return this.apps.get(id);
  }

  async getWorkspaceApps(workspaceId: string): Promise<App[]> {
    return Array.from(this.apps.values())
      .filter(app => app.workspaceId === workspaceId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async createApp(insertApp: InsertApp): Promise<App> {
    const id = randomUUID();
    const now = new Date();
    const app: App = {
      ...insertApp,
      id,
      isPrivate: insertApp.isPrivate ?? 'true',
      isPublished: insertApp.isPublished ?? 'false',
      backgroundColor: insertApp.backgroundColor ?? 'bg-gradient-to-br from-blue-500 to-purple-600',
      objectStoragePath: insertApp.objectStoragePath ?? null,
      filesInitialized: insertApp.filesInitialized ?? 'false',
      createdAt: now,
      updatedAt: now,
    };
    this.apps.set(id, app);
    return app;
  }

  async updateApp(id: string, updates: Partial<InsertApp>): Promise<App | undefined> {
    const existing = this.apps.get(id);
    if (!existing) return undefined;
    
    const updated: App = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    
    this.apps.set(id, updated);
    return updated;
  }

  async deleteApp(id: string): Promise<boolean> {
    return this.apps.delete(id);
  }

  async searchApps(workspaceId: string, query: string): Promise<App[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.apps.values())
      .filter(app => 
        app.workspaceId === workspaceId &&
        (app.title.toLowerCase().includes(lowercaseQuery) ||
        app.creator.toLowerCase().includes(lowercaseQuery))
      )
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  // Template methods
  async getTemplate(id: string): Promise<Template | undefined> {
    return this.templates.get(id);
  }

  async getAllTemplates(): Promise<Template[]> {
    return Array.from(this.templates.values())
      .sort((a, b) => {
        // Sort by usage count (descending), then by title
        const aUsage = parseInt(a.usageCount || '0');
        const bUsage = parseInt(b.usageCount || '0');
        if (aUsage !== bUsage) {
          return bUsage - aUsage;
        }
        return a.title.localeCompare(b.title);
      });
  }

  async getTemplatesByCategory(category: string): Promise<Template[]> {
    return Array.from(this.templates.values())
      .filter(template => template.category === category)
      .sort((a, b) => {
        const aUsage = parseInt(a.usageCount || '0');
        const bUsage = parseInt(b.usageCount || '0');
        if (aUsage !== bUsage) {
          return bUsage - aUsage;
        }
        return a.title.localeCompare(b.title);
      });
  }

  async searchTemplates(query: string, category?: string): Promise<Template[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.templates.values())
      .filter(template => {
        const matchesQuery = template.title.toLowerCase().includes(lowercaseQuery) ||
                           template.description.toLowerCase().includes(lowercaseQuery) ||
                           template.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery));
        
        const matchesCategory = !category || template.category === category;
        
        return matchesQuery && matchesCategory;
      })
      .sort((a, b) => {
        const aUsage = parseInt(a.usageCount || '0');
        const bUsage = parseInt(b.usageCount || '0');
        if (aUsage !== bUsage) {
          return bUsage - aUsage;
        }
        return a.title.localeCompare(b.title);
      });
  }

  async incrementTemplateUsage(id: string): Promise<void> {
    const template = this.templates.get(id);
    if (template) {
      const currentUsage = parseInt(template.usageCount || '0');
      const updatedTemplate: Template = {
        ...template,
        usageCount: (currentUsage + 1).toString(),
        updatedAt: new Date()
      };
      this.templates.set(id, updatedTemplate);
    }
  }

  // Chat conversation methods
  async getChatConversation(id: string): Promise<ChatConversation | undefined> {
    return this.chatConversations.get(id);
  }

  async getUserChatConversations(userId: string): Promise<ChatConversation[]> {
    return Array.from(this.chatConversations.values())
      .filter(conversation => conversation.userId === userId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async createChatConversation(conversation: InsertChatConversation): Promise<ChatConversation> {
    const id = randomUUID();
    const now = new Date();
    const newConversation: ChatConversation = {
      id,
      userId: conversation.userId,
      workspaceId: conversation.workspaceId,
      status: conversation.status || 'active',
      phase: conversation.phase || 'planning',
      projectIdea: conversation.projectIdea || null,
      finalPlan: conversation.finalPlan || null,
      selectedMode: conversation.selectedMode || null,
      createdAt: now,
      updatedAt: now,
    };
    this.chatConversations.set(id, newConversation);
    return newConversation;
  }

  async updateChatConversation(id: string, conversation: Partial<InsertChatConversation>): Promise<ChatConversation | undefined> {
    const existing = this.chatConversations.get(id);
    if (!existing) return undefined;

    const updated: ChatConversation = {
      ...existing,
      ...conversation,
      updatedAt: new Date(),
    };
    this.chatConversations.set(id, updated);
    return updated;
  }

  async deleteChatConversation(id: string): Promise<boolean> {
    // Also delete all messages in this conversation
    const messages = Array.from(this.chatMessages.values())
      .filter(message => message.conversationId === id);
    messages.forEach(message => this.chatMessages.delete(message.id));
    
    return this.chatConversations.delete(id);
  }

  // Chat message methods
  async getChatMessage(id: string): Promise<ChatMessage | undefined> {
    return this.chatMessages.get(id);
  }

  async getConversationMessages(conversationId: string): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values())
      .filter(message => message.conversationId === conversationId)
      .sort((a, b) => parseInt(a.messageIndex) - parseInt(b.messageIndex));
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const id = randomUUID();
    const now = new Date();
    const newMessage: ChatMessage = {
      id,
      ...message,
      createdAt: now,
    };
    this.chatMessages.set(id, newMessage);
    return newMessage;
  }

  async deleteChatMessage(id: string): Promise<boolean> {
    return this.chatMessages.delete(id);
  }

  // App file management methods
  async initializeAppFiles(appId: string, objectStoragePath: string): Promise<boolean> {
    const app = this.apps.get(appId);
    if (!app) return false;

    const updatedApp: App = {
      ...app,
      objectStoragePath,
      filesInitialized: 'true',
      updatedAt: new Date(),
    };
    this.apps.set(appId, updatedApp);
    return true;
  }

  async updateAppObjectStoragePath(appId: string, objectStoragePath: string): Promise<App | undefined> {
    const app = this.apps.get(appId);
    if (!app) return undefined;

    const updatedApp: App = {
      ...app,
      objectStoragePath,
      updatedAt: new Date(),
    };
    this.apps.set(appId, updatedApp);
    return updatedApp;
  }

  // Create user-specific sample data when they first get a personal workspace
  async createUserSampleData(workspaceId: string, userName: string, userId: string): Promise<void> {
    const backgroundColors = [
      'bg-gradient-to-br from-orange-400 to-red-500',
      'bg-gradient-to-br from-gray-700 to-gray-900',
      'bg-gradient-to-br from-blue-500 to-purple-600',
      'bg-gradient-to-br from-green-400 to-blue-500',
      'bg-gradient-to-br from-purple-400 to-pink-500',
      'bg-gradient-to-br from-yellow-400 to-orange-500',
    ];

    // Sample projects for the user's personal workspace
    const sampleProjects: InsertProject[] = [
      {
        workspaceId: workspaceId,
        title: "My First Project",
        description: "A starter project to get you going",
        category: "web",
        isPrivate: "true",
        backgroundColor: backgroundColors[0],
        deploymentStatus: "published"
      },
      {
        workspaceId: workspaceId,
        title: "Data Analysis Tool",
        description: "Analyze and visualize your data",
        category: "data",
        isPrivate: "true",
        backgroundColor: backgroundColors[1],
        deploymentStatus: null
      }
    ];

    // Sample apps for the user's personal workspace
    const sampleApps: InsertApp[] = [
      {
        workspaceId: workspaceId,
        title: "My First App",
        creator: userName,
        creatorUserId: userId,
        isPublished: "true",
        backgroundColor: backgroundColors[0],
        gitInitialized: "false"
      },
      {
        workspaceId: workspaceId,
        title: "Todo Manager",
        creator: userName,
        creatorUserId: userId,
        isPublished: "false",
        backgroundColor: backgroundColors[2],
        gitInitialized: "false"
      },
      {
        workspaceId: workspaceId,
        title: "Portfolio Site",
        creator: userName,
        creatorUserId: userId,
        isPublished: "false",
        backgroundColor: backgroundColors[4],
        gitInitialized: "false"
      }
    ];
    
    // Create sample projects
    for (const project of sampleProjects) {
      await this.createProject(project);
    }
    
    // Create sample apps
    for (const app of sampleApps) {
      await this.createApp(app);
    }
  }
}

// Database storage implementation using Drizzle ORM
export class DBStorage implements IStorage {
  private db;

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is required");
    }
    const sql = neon(process.env.DATABASE_URL);
    this.db = drizzle(sql);
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async upsertUser(user: UpsertUser): Promise<User> {
    const now = new Date();
    const existingUser = await this.getUser(user.id);
    
    if (existingUser) {
      const updated = await this.db
        .update(users)
        .set({ ...user, updatedAt: now })
        .where(eq(users.id, user.id))
        .returning();
      return updated[0];
    } else {
      const created = await this.db
        .insert(users)
        .values({ ...user, createdAt: now, updatedAt: now })
        .returning();
      return created[0];
    }
  }

  async updateUser(id: string, updates: Partial<{ firstName: string; lastName: string; bio: string }>): Promise<User | undefined> {
    const updated = await this.db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updated[0];
  }

  // Workspace methods
  async getWorkspace(id: string): Promise<Workspace | undefined> {
    const result = await this.db.select().from(workspaces).where(eq(workspaces.id, id)).limit(1);
    return result[0];
  }

  async getUserWorkspaces(userId: string): Promise<Workspace[]> {
    const membershipRecords = await this.db
      .select()
      .from(workspaceMembers)
      .where(eq(workspaceMembers.userId, userId));
    
    if (membershipRecords.length === 0) {
      return [];
    }
    
    const workspaceIds = membershipRecords.map(m => m.workspaceId);
    const workspaceResults = await this.db
      .select()
      .from(workspaces)
      .where(or(...workspaceIds.map(id => eq(workspaces.id, id))));
    
    // Sort personal workspace first
    return workspaceResults.sort((a, b) => {
      if (a.type === 'personal' && b.type !== 'personal') return -1;
      if (b.type === 'personal' && a.type !== 'personal') return 1;
      return a.name.localeCompare(b.name);
    });
  }

  async createWorkspace(workspace: InsertWorkspace): Promise<Workspace> {
    const now = new Date();
    const created = await this.db
      .insert(workspaces)
      .values({ ...workspace, createdAt: now, updatedAt: now })
      .returning();
    return created[0];
  }

  async updateWorkspace(id: string, workspace: Partial<InsertWorkspace>): Promise<Workspace | undefined> {
    const updated = await this.db
      .update(workspaces)
      .set({ ...workspace, updatedAt: new Date() })
      .where(eq(workspaces.id, id))
      .returning();
    return updated[0];
  }

  async deleteWorkspace(id: string): Promise<boolean> {
    const deleted = await this.db.delete(workspaces).where(eq(workspaces.id, id)).returning();
    return deleted.length > 0;
  }

  async getDefaultWorkspace(userId: string): Promise<Workspace | undefined> {
    const userWorkspaces = await this.getUserWorkspaces(userId);
    return userWorkspaces.find(w => w.type === 'personal') || userWorkspaces[0];
  }

  // Workspace membership methods
  async addWorkspaceMember(member: InsertWorkspaceMember): Promise<WorkspaceMember> {
    const now = new Date();
    const created = await this.db
      .insert(workspaceMembers)
      .values({ ...member, createdAt: now })
      .returning();
    return created[0];
  }

  async removeWorkspaceMember(workspaceId: string, userId: string): Promise<boolean> {
    const deleted = await this.db
      .delete(workspaceMembers)
      .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, userId)))
      .returning();
    return deleted.length > 0;
  }

  async getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    return await this.db
      .select()
      .from(workspaceMembers)
      .where(eq(workspaceMembers.workspaceId, workspaceId))
      .orderBy(workspaceMembers.createdAt);
  }

  async getWorkspaceMembersWithUsers(workspaceId: string): Promise<WorkspaceMemberWithUser[]> {
    const members = await this.getWorkspaceMembers(workspaceId);
    const membersWithUsers: WorkspaceMemberWithUser[] = [];
    
    for (const member of members) {
      const user = await this.getUser(member.userId);
      if (user) {
        membersWithUsers.push({
          id: member.id,
          workspaceId: member.workspaceId,
          role: member.role,
          createdAt: member.createdAt || new Date(),
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            profileImageUrl: user.profileImageUrl,
          }
        });
      }
    }
    
    return membersWithUsers;
  }

  async isWorkspaceMember(workspaceId: string, userId: string): Promise<boolean> {
    const result = await this.db
      .select()
      .from(workspaceMembers)
      .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, userId)))
      .limit(1);
    return result.length > 0;
  }

  // Stub methods for remaining interface - implementing only what's needed for workspace functionality
  async getProject(id: string): Promise<Project | undefined> { return undefined; }
  async getWorkspaceProjects(workspaceId: string): Promise<Project[]> { return []; }
  async createProject(project: InsertProject): Promise<Project> { throw new Error("Not implemented"); }
  async updateProject(id: string, project: Partial<InsertProject>): Promise<Project | undefined> { return undefined; }
  async deleteProject(id: string): Promise<boolean> { return false; }
  async searchProjects(workspaceId: string, query: string): Promise<Project[]> { return []; }
  
  async getApp(id: string): Promise<App | undefined> { return undefined; }
  async getWorkspaceApps(workspaceId: string): Promise<App[]> { return []; }
  async createApp(app: InsertApp): Promise<App> { throw new Error("Not implemented"); }
  async updateApp(id: string, app: Partial<InsertApp>): Promise<App | undefined> { return undefined; }
  async deleteApp(id: string): Promise<boolean> { return false; }
  async searchApps(workspaceId: string, query: string): Promise<App[]> { return []; }
  
  async getTemplate(id: string): Promise<Template | undefined> { return undefined; }
  async getAllTemplates(): Promise<Template[]> { return []; }
  async getTemplatesByCategory(category: string): Promise<Template[]> { return []; }
  async searchTemplates(query: string, category?: string): Promise<Template[]> { return []; }
  async incrementTemplateUsage(id: string): Promise<void> {}
  
  async getChatConversation(id: string): Promise<ChatConversation | undefined> { return undefined; }
  async getUserChatConversations(userId: string): Promise<ChatConversation[]> { return []; }
  async createChatConversation(conversation: InsertChatConversation): Promise<ChatConversation> { throw new Error("Not implemented"); }
  async updateChatConversation(id: string, conversation: Partial<InsertChatConversation>): Promise<ChatConversation | undefined> { return undefined; }
  async deleteChatConversation(id: string): Promise<boolean> { return false; }
  
  async getChatMessage(id: string): Promise<ChatMessage | undefined> { return undefined; }
  async getConversationMessages(conversationId: string): Promise<ChatMessage[]> { return []; }
  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> { throw new Error("Not implemented"); }
  async deleteChatMessage(id: string): Promise<boolean> { return false; }
  
  async initializeAppFiles(appId: string, objectStoragePath: string): Promise<boolean> { return false; }
  async updateAppObjectStoragePath(appId: string, objectStoragePath: string): Promise<App | undefined> { return undefined; }
  
  async createUserSampleData(workspaceId: string, userName: string, userId: string): Promise<void> {}
}

export const storage = new DBStorage();
