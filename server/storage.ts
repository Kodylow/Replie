import { type User, type InsertUser, type Project, type InsertProject } from "@shared/schema";
import { randomUUID } from "crypto";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Project methods
  getProject(id: string): Promise<Project | undefined>;
  getAllProjects(): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, project: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: string): Promise<boolean>;
  searchProjects(query: string): Promise<Project[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private projects: Map<string, Project>;

  constructor() {
    this.users = new Map();
    this.projects = new Map();
    
    // Add some sample projects for demonstration
    this.initializeSampleProjects();
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

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
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
}

export const storage = new MemStorage();
