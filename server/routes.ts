import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProjectSchema, insertAppSchema, insertWorkspaceSchema, insertWorkspaceMemberSchema, createTeamSchema } from "@shared/schema";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware setup
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Workspace routes
  
  // Get user's workspaces
  app.get("/api/workspaces", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const workspaces = await storage.getUserWorkspaces(userId);
      res.json(workspaces);
    } catch (error) {
      console.error("Error fetching workspaces:", error);
      res.status(500).json({ error: "Failed to fetch workspaces" });
    }
  });

  // Get workspace by ID
  app.get("/api/workspaces/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const workspaceId = req.params.id;
      
      // Check if user is a member of this workspace
      const isMember = await storage.isWorkspaceMember(workspaceId, userId);
      if (!isMember) {
        return res.status(403).json({ error: "Access denied to workspace" });
      }
      
      const workspace = await storage.getWorkspace(workspaceId);
      if (!workspace) {
        return res.status(404).json({ error: "Workspace not found" });
      }
      res.json(workspace);
    } catch (error) {
      console.error("Error fetching workspace:", error);
      res.status(500).json({ error: "Failed to fetch workspace" });
    }
  });

  // Create new workspace
  app.post("/api/workspaces", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertWorkspaceSchema.parse(req.body);
      
      const workspace = await storage.createWorkspace(validatedData);
      
      // Add creator as owner
      await storage.addWorkspaceMember({
        workspaceId: workspace.id,
        userId: userId,
        role: "owner"
      });
      
      res.status(201).json(workspace);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: error.errors 
        });
      }
      console.error("Error creating workspace:", error);
      res.status(500).json({ error: "Failed to create workspace" });
    }
  });

  // Update workspace
  app.patch("/api/workspaces/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const workspaceId = req.params.id;
      
      // Check if user is a member of this workspace
      const isMember = await storage.isWorkspaceMember(workspaceId, userId);
      if (!isMember) {
        return res.status(403).json({ error: "Access denied to workspace" });
      }
      
      const updates = insertWorkspaceSchema.partial().parse(req.body);
      const workspace = await storage.updateWorkspace(workspaceId, updates);
      if (!workspace) {
        return res.status(404).json({ error: "Workspace not found" });
      }
      res.json(workspace);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: error.errors 
        });
      }
      console.error("Error updating workspace:", error);
      res.status(500).json({ error: "Failed to update workspace" });
    }
  });

  // Get workspace members
  app.get("/api/workspaces/:id/members", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const workspaceId = req.params.id;
      
      // Check if user is a member of this workspace
      const isMember = await storage.isWorkspaceMember(workspaceId, userId);
      if (!isMember) {
        return res.status(403).json({ error: "Access denied to workspace" });
      }
      
      const members = await storage.getWorkspaceMembersWithUsers(workspaceId);
      res.json(members);
    } catch (error) {
      console.error("Error fetching workspace members:", error);
      res.status(500).json({ error: "Failed to fetch workspace members" });
    }
  });

  // Add workspace member
  app.post("/api/workspaces/:id/members", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const workspaceId = req.params.id;
      
      // Check if user is a member of this workspace
      const isMember = await storage.isWorkspaceMember(workspaceId, userId);
      if (!isMember) {
        return res.status(403).json({ error: "Access denied to workspace" });
      }
      
      const validatedData = insertWorkspaceMemberSchema.parse({
        ...req.body,
        workspaceId
      });
      
      const member = await storage.addWorkspaceMember(validatedData);
      res.status(201).json(member);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: error.errors 
        });
      }
      console.error("Error adding workspace member:", error);
      res.status(500).json({ error: "Failed to add workspace member" });
    }
  });

  // Remove workspace member
  app.delete("/api/workspaces/:id/members/:userId", isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = req.user.claims.sub;
      const workspaceId = req.params.id;
      const targetUserId = req.params.userId;
      
      // Check if user is a member of this workspace
      const isMember = await storage.isWorkspaceMember(workspaceId, currentUserId);
      if (!isMember) {
        return res.status(403).json({ error: "Access denied to workspace" });
      }
      
      const success = await storage.removeWorkspaceMember(workspaceId, targetUserId);
      if (!success) {
        return res.status(404).json({ error: "Member not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error removing workspace member:", error);
      res.status(500).json({ error: "Failed to remove workspace member" });
    }
  });

  // Team creation route - specialized endpoint for creating team workspaces
  app.post("/api/teams", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = createTeamSchema.parse(req.body);
      
      // Generate slug from organization name
      const slug = validatedData.organizationName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      
      // Create the team workspace
      const workspace = await storage.createWorkspace({
        name: validatedData.organizationName,
        type: 'team',
        slug: slug,
        description: validatedData.description || null,
      });
      
      // Add creator as owner
      await storage.addWorkspaceMember({
        workspaceId: workspace.id,
        userId: userId,
        role: "owner"
      });
      
      // Parse and process team member invites (for now just log them)
      if (validatedData.inviteEmails && validatedData.inviteEmails.trim()) {
        const emails = validatedData.inviteEmails
          .split(',')
          .map(email => email.trim())
          .filter(email => email.length > 0);
        
        // For now, just log the invited emails
        // TODO: In future implementation, send actual email invitations
        console.log(`Team ${workspace.name} created with invited emails:`, emails);
      }
      
      // Log billing information for future Stripe integration
      console.log(`Team ${workspace.name} created with plan: ${validatedData.plan}, billing email: ${validatedData.billingEmail}`);
      
      res.status(201).json({
        workspace,
        message: "Team created successfully",
        billingEmail: validatedData.billingEmail,
        plan: validatedData.plan
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: error.errors 
        });
      }
      console.error("Error creating team:", error);
      res.status(500).json({ error: "Failed to create team" });
    }
  });

  // Project routes (workspace-scoped)
  
  // Get workspace projects
  app.get("/api/workspaces/:workspaceId/projects", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const workspaceId = req.params.workspaceId;
      
      // Check if user is a member of this workspace
      const isMember = await storage.isWorkspaceMember(workspaceId, userId);
      if (!isMember) {
        return res.status(403).json({ error: "Access denied to workspace" });
      }
      
      const projects = await storage.getWorkspaceProjects(workspaceId);
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });

  // Get project by ID
  app.get("/api/projects/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      // Check if user is a member of the project's workspace
      const isMember = await storage.isWorkspaceMember(project.workspaceId, userId);
      if (!isMember) {
        return res.status(403).json({ error: "Access denied to project" });
      }
      
      res.json(project);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ error: "Failed to fetch project" });
    }
  });

  // Create new project
  app.post("/api/workspaces/:workspaceId/projects", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const workspaceId = req.params.workspaceId;
      
      // Check if user is a member of this workspace
      const isMember = await storage.isWorkspaceMember(workspaceId, userId);
      if (!isMember) {
        return res.status(403).json({ error: "Access denied to workspace" });
      }
      
      const validatedData = insertProjectSchema.parse({
        ...req.body,
        workspaceId
      });
      const project = await storage.createProject(validatedData);
      res.status(201).json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: error.errors 
        });
      }
      console.error("Error creating project:", error);
      res.status(500).json({ error: "Failed to create project" });
    }
  });

  // Update project
  app.patch("/api/projects/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      // Check if user is a member of the project's workspace
      const isMember = await storage.isWorkspaceMember(project.workspaceId, userId);
      if (!isMember) {
        return res.status(403).json({ error: "Access denied to project" });
      }
      
      // Remove workspaceId from updates to prevent workspace reassignment
      const { workspaceId: _, ...updates } = insertProjectSchema.partial().parse(req.body);
      const updatedProject = await storage.updateProject(req.params.id, updates);
      res.json(updatedProject);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: error.errors 
        });
      }
      console.error("Error updating project:", error);
      res.status(500).json({ error: "Failed to update project" });
    }
  });

  // Delete project
  app.delete("/api/projects/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      // Check if user is a member of the project's workspace
      const isMember = await storage.isWorkspaceMember(project.workspaceId, userId);
      if (!isMember) {
        return res.status(403).json({ error: "Access denied to project" });
      }
      
      const success = await storage.deleteProject(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ error: "Failed to delete project" });
    }
  });

  // Search projects in workspace
  app.get("/api/workspaces/:workspaceId/projects/search/:query", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const workspaceId = req.params.workspaceId;
      
      // Check if user is a member of this workspace
      const isMember = await storage.isWorkspaceMember(workspaceId, userId);
      if (!isMember) {
        return res.status(403).json({ error: "Access denied to workspace" });
      }
      
      const projects = await storage.searchProjects(workspaceId, req.params.query);
      res.json(projects);
    } catch (error) {
      console.error("Error searching projects:", error);
      res.status(500).json({ error: "Failed to search projects" });
    }
  });

  // App routes (workspace-scoped)
  
  // Get workspace apps
  app.get("/api/workspaces/:workspaceId/apps", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const workspaceId = req.params.workspaceId;
      
      // Check if user is a member of this workspace
      const isMember = await storage.isWorkspaceMember(workspaceId, userId);
      if (!isMember) {
        return res.status(403).json({ error: "Access denied to workspace" });
      }
      
      const apps = await storage.getWorkspaceApps(workspaceId);
      res.json(apps);
    } catch (error) {
      console.error("Error fetching apps:", error);
      res.status(500).json({ error: "Failed to fetch apps" });
    }
  });

  // Get app by ID
  app.get("/api/apps/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const app = await storage.getApp(req.params.id);
      if (!app) {
        return res.status(404).json({ error: "App not found" });
      }
      
      // Check if user is a member of the app's workspace
      const isMember = await storage.isWorkspaceMember(app.workspaceId, userId);
      if (!isMember) {
        return res.status(403).json({ error: "Access denied to app" });
      }
      
      res.json(app);
    } catch (error) {
      console.error("Error fetching app:", error);
      res.status(500).json({ error: "Failed to fetch app" });
    }
  });

  // Create new app
  app.post("/api/workspaces/:workspaceId/apps", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const workspaceId = req.params.workspaceId;
      
      // Check if user is a member of this workspace
      const isMember = await storage.isWorkspaceMember(workspaceId, userId);
      if (!isMember) {
        return res.status(403).json({ error: "Access denied to workspace" });
      }
      
      const validatedData = insertAppSchema.parse({
        ...req.body,
        workspaceId
      });
      const app = await storage.createApp(validatedData);
      res.status(201).json(app);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: error.errors 
        });
      }
      console.error("Error creating app:", error);
      res.status(500).json({ error: "Failed to create app" });
    }
  });

  // Update app
  app.patch("/api/apps/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const app = await storage.getApp(req.params.id);
      if (!app) {
        return res.status(404).json({ error: "App not found" });
      }
      
      // Check if user is a member of the app's workspace
      const isMember = await storage.isWorkspaceMember(app.workspaceId, userId);
      if (!isMember) {
        return res.status(403).json({ error: "Access denied to app" });
      }
      
      // Remove workspaceId from updates to prevent workspace reassignment
      const { workspaceId: _, ...updates } = insertAppSchema.partial().parse(req.body);
      const updatedApp = await storage.updateApp(req.params.id, updates);
      res.json(updatedApp);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: error.errors 
        });
      }
      console.error("Error updating app:", error);
      res.status(500).json({ error: "Failed to update app" });
    }
  });

  // Delete app
  app.delete("/api/apps/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const app = await storage.getApp(req.params.id);
      if (!app) {
        return res.status(404).json({ error: "App not found" });
      }
      
      // Check if user is a member of the app's workspace
      const isMember = await storage.isWorkspaceMember(app.workspaceId, userId);
      if (!isMember) {
        return res.status(403).json({ error: "Access denied to app" });
      }
      
      const success = await storage.deleteApp(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting app:", error);
      res.status(500).json({ error: "Failed to delete app" });
    }
  });

  // Search apps in workspace
  app.get("/api/workspaces/:workspaceId/apps/search/:query", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const workspaceId = req.params.workspaceId;
      
      // Check if user is a member of this workspace
      const isMember = await storage.isWorkspaceMember(workspaceId, userId);
      if (!isMember) {
        return res.status(403).json({ error: "Access denied to workspace" });
      }
      
      const apps = await storage.searchApps(workspaceId, req.params.query);
      res.json(apps);
    } catch (error) {
      console.error("Error searching apps:", error);
      res.status(500).json({ error: "Failed to search apps" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
