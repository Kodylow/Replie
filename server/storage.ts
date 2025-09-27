import { type User, type UpsertUser, type InsertUser, type Project, type InsertProject, type App, type InsertApp, type Workspace, type InsertWorkspace, type WorkspaceMember, type InsertWorkspaceMember, type WorkspaceMemberWithUser } from "@shared/schema";
import { randomUUID } from "crypto";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User methods (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
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
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private workspaces: Map<string, Workspace>;
  private workspaceMembers: Map<string, WorkspaceMember>;
  private projects: Map<string, Project>;
  private apps: Map<string, App>;

  constructor() {
    this.users = new Map();
    this.workspaces = new Map();
    this.workspaceMembers = new Map();
    this.projects = new Map();
    this.apps = new Map();
    
    // Initialize sample data
    this.initializeSampleData();
  }

  private async initializeSampleData() {
    // Create a sample personal workspace
    const personalWorkspace = await this.createWorkspace({
      name: "Personal",
      type: "personal",
      slug: "personal",
      description: "Your personal workspace"
    });

    // Create a sample team workspace
    const teamWorkspace = await this.createWorkspace({
      name: "Acme Corp",
      type: "team", 
      slug: "acme-corp",
      description: "Acme Corporation team workspace"
    });

    // Sample projects for personal workspace
    const personalProjects: InsertProject[] = [
      {
        workspaceId: personalWorkspace.id,
        title: "CashflowRetro",
        description: "Waiting for you",
        category: "web",
        isPrivate: "true",
        backgroundColor: "bg-gradient-to-br from-orange-400 to-red-500",
        deploymentStatus: "published"
      },
      {
        workspaceId: personalWorkspace.id,
        title: "StrikeAutoPilot",
        description: "Automated trading system",
        category: "data",
        isPrivate: "true",
        backgroundColor: "bg-gradient-to-br from-gray-700 to-gray-900",
        deploymentStatus: "failed"
      }
    ];

    // Sample projects for team workspace
    const teamProjects: InsertProject[] = [
      {
        workspaceId: teamWorkspace.id,
        title: "OmnicronPitch",
        description: "Pitch deck generator",
        category: "general",
        isPrivate: "false",
        backgroundColor: "bg-gradient-to-br from-blue-500 to-purple-600",
        deploymentStatus: null
      }
    ];
    
    // Sample apps for personal workspace
    const personalApps: InsertApp[] = [
      {
        workspaceId: personalWorkspace.id,
        title: "EventScraper",
        creator: "NickCo2",
        isPublished: "false",
        backgroundColor: "bg-gradient-to-br from-orange-400 to-red-500"
      },
      {
        workspaceId: personalWorkspace.id,
        title: "EventHarvest",
        creator: "NickCo2", 
        isPublished: "false",
        backgroundColor: "bg-gradient-to-br from-gray-700 to-gray-900"
      },
      {
        workspaceId: personalWorkspace.id,
        title: "VetConnect",
        creator: "NickCo2",
        isPublished: "false",
        backgroundColor: "bg-gradient-to-br from-blue-500 to-purple-600"
      }
    ];

    // Sample apps for team workspace
    const teamApps: InsertApp[] = [
      {
        workspaceId: teamWorkspace.id,
        title: "ClearWaterOps",
        creator: "TeamAcme",
        isPublished: "true",
        backgroundColor: "bg-gradient-to-br from-green-400 to-blue-500"
      },
      {
        workspaceId: teamWorkspace.id,
        title: "ReplShowcase",
        creator: "TeamAcme",
        isPublished: "false",
        backgroundColor: "bg-gradient-to-br from-purple-400 to-pink-500"
      }
    ];
    
    // Create sample users
    const sampleUsers = [
      {
        id: "user-1",
        email: "alice@acme.com",
        firstName: "Alice",
        lastName: "Johnson",
        profileImageUrl: null
      },
      {
        id: "user-2", 
        email: "bob@acme.com",
        firstName: "Bob",
        lastName: "Smith",
        profileImageUrl: null
      },
      {
        id: "user-3",
        email: "charlie@acme.com",
        firstName: "Charlie",
        lastName: "Brown", 
        profileImageUrl: null
      },
      {
        id: "user-4",
        email: "diana@acme.com",
        firstName: "Diana",
        lastName: "Wilson",
        profileImageUrl: null
      },
      {
        id: "user-5",
        email: "eve@acme.com",
        firstName: "Eve",
        lastName: "Davis",
        profileImageUrl: null
      }
    ];

    // Create users
    for (const userData of sampleUsers) {
      await this.upsertUser(userData);
    }

    // Create workspace members for team workspace
    const teamMembers = [
      {
        workspaceId: teamWorkspace.id,
        userId: "user-1",
        role: "admin"
      },
      {
        workspaceId: teamWorkspace.id,
        userId: "user-2", 
        role: "admin"
      },
      {
        workspaceId: teamWorkspace.id,
        userId: "user-3",
        role: "member"
      },
      {
        workspaceId: teamWorkspace.id,
        userId: "user-4",
        role: "member"
      },
      {
        workspaceId: teamWorkspace.id,
        userId: "user-5",
        role: "member"
      }
    ];

    // Add members to team workspace
    for (const member of teamMembers) {
      await this.addWorkspaceMember(member);
    }
    
    // Create all projects and apps
    for (const project of [...personalProjects, ...teamProjects]) {
      await this.createProject(project);
    }
    
    for (const app of [...personalApps, ...teamApps]) {
      await this.createApp(app);
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
          console.log(`Note: User ${newUser.id} already member of workspace ${workspace.id}`);
        }
      }
      
      return newUser;
    }
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
}

export const storage = new MemStorage();
