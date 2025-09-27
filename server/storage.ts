import { type User, type UpsertUser, type InsertUser, type Project, type InsertProject, type App, type InsertApp } from "@shared/schema";
import { randomUUID } from "crypto";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User methods (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Project methods
  getProject(id: string): Promise<Project | undefined>;
  getAllProjects(): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, project: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: string): Promise<boolean>;
  searchProjects(query: string): Promise<Project[]>;
  
  // App methods
  getApp(id: string): Promise<App | undefined>;
  getAllApps(): Promise<App[]>;
  createApp(app: InsertApp): Promise<App>;
  updateApp(id: string, app: Partial<InsertApp>): Promise<App | undefined>;
  deleteApp(id: string): Promise<boolean>;
  searchApps(query: string): Promise<App[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private projects: Map<string, Project>;
  private apps: Map<string, App>;

  constructor() {
    this.users = new Map();
    this.projects = new Map();
    this.apps = new Map();
    
    // Add some sample projects for demonstration
    this.initializeSampleProjects();
    // Add some sample apps for demonstration
    this.initializeSampleApps();
  }

  private async initializeSampleProjects() {
    const sampleProjects: InsertProject[] = [
      {
        title: "CashflowRetro",
        description: "Waiting for you",
        category: "web",
        isPrivate: "true",
        backgroundColor: "bg-gradient-to-br from-orange-400 to-red-500",
        deploymentStatus: "published"
      },
      {
        title: "StrikeAutoPilot",
        description: "Automated trading system",
        category: "data",
        isPrivate: "true",
        backgroundColor: "bg-gradient-to-br from-gray-700 to-gray-900",
        deploymentStatus: "failed"
      },
      {
        title: "OmnicronPitch",
        description: "Pitch deck generator",
        category: "general",
        isPrivate: "true",
        backgroundColor: "bg-gradient-to-br from-blue-500 to-purple-600",
        deploymentStatus: null
      }
    ];
    
    for (const project of sampleProjects) {
      await this.createProject(project);
    }
  }

  private async initializeSampleApps() {
    const sampleApps: InsertApp[] = [
      {
        title: "EventScraper",
        creator: "NickCo2",
        isPublished: "false",
        backgroundColor: "bg-gradient-to-br from-orange-400 to-red-500"
      },
      {
        title: "EventHarvest",
        creator: "NickCo2", 
        isPublished: "false",
        backgroundColor: "bg-gradient-to-br from-gray-700 to-gray-900"
      },
      {
        title: "VetConnect",
        creator: "NickCo2",
        isPublished: "false",
        backgroundColor: "bg-gradient-to-br from-blue-500 to-purple-600"
      },
      {
        title: "ClearWaterOps",
        creator: "NickCo2",
        isPublished: "true",
        backgroundColor: "bg-gradient-to-br from-green-400 to-blue-500"
      },
      {
        title: "ReplShowcase",
        creator: "AndrewV-Replit",
        isPublished: "false",
        backgroundColor: "bg-gradient-to-br from-purple-400 to-pink-500"
      },
      {
        title: "SiteRoutePro",
        creator: "michaelemling",
        isPublished: "false",
        backgroundColor: "bg-gradient-to-br from-yellow-400 to-orange-500"
      },
      {
        title: "OrgChartPro",
        creator: "kodylow",
        isPublished: "false",
        backgroundColor: "bg-gradient-to-br from-cyan-400 to-blue-500"
      },
      {
        title: "PixelPortals",
        creator: "kodylow",
        isPublished: "false",
        backgroundColor: "bg-gradient-to-br from-red-400 to-pink-500"
      }
    ];
    
    for (const app of sampleApps) {
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
      return newUser;
    }
  }

  // Project methods
  async getProject(id: string): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async getAllProjects(): Promise<Project[]> {
    return Array.from(this.projects.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
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

  async searchProjects(query: string): Promise<Project[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.projects.values())
      .filter(project => 
        project.title.toLowerCase().includes(lowercaseQuery) ||
        (project.description && project.description.toLowerCase().includes(lowercaseQuery)) ||
        project.category.toLowerCase().includes(lowercaseQuery)
      )
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  // App methods
  async getApp(id: string): Promise<App | undefined> {
    return this.apps.get(id);
  }

  async getAllApps(): Promise<App[]> {
    return Array.from(this.apps.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  async createApp(insertApp: InsertApp): Promise<App> {
    const id = randomUUID();
    const now = new Date();
    const app: App = {
      ...insertApp,
      id,
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

  async searchApps(query: string): Promise<App[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.apps.values())
      .filter(app => 
        app.title.toLowerCase().includes(lowercaseQuery) ||
        app.creator.toLowerCase().includes(lowercaseQuery)
      )
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }
}

export const storage = new MemStorage();
