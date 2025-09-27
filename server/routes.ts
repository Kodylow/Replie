import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProjectSchema, insertAppSchema, insertWorkspaceSchema, insertWorkspaceMemberSchema, createTeamSchema, updateProfileSchema, githubImportSchema, zipImportSchema, templateCloneSchema, planningChatSchema, modeSelectionSchema } from "@shared/schema";
import OpenAI from 'openai';
import { setupAuth, isAuthenticated } from "./replitAuth";
import { z } from "zod";
import { Octokit } from '@octokit/rest';
import multer from 'multer';
import AdmZip from 'adm-zip';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize OpenAI client
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // Auth middleware setup
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let user = await storage.getUser(userId);
      
      // If user doesn't exist in storage, create them from the auth claims
      if (!user) {
        const claims = req.user.claims;
        user = await storage.upsertUser({
          id: userId,
          email: claims.email,
          firstName: claims.first_name || "User",
          lastName: claims.last_name,
          profileImageUrl: claims.profile_image_url,
        });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Profile routes
  app.patch('/api/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = updateProfileSchema.parse(req.body);
      
      const updatedUser = await storage.updateUser(userId, validatedData);
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json(updatedUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: error.errors 
        });
      }
      console.error("Error updating profile:", error);
      res.status(500).json({ error: "Failed to update profile" });
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

  // GitHub Integration Helper Functions
  let connectionSettings: any;

  async function getAccessToken() {
    if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
      return connectionSettings.settings.access_token;
    }
    
    const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME
    const xReplitToken = process.env.REPL_IDENTITY 
      ? 'repl ' + process.env.REPL_IDENTITY 
      : process.env.WEB_REPL_RENEWAL 
      ? 'depl ' + process.env.WEB_REPL_RENEWAL 
      : null;

    if (!xReplitToken) {
      throw new Error('X_REPLIT_TOKEN not found for repl/depl');
    }

    connectionSettings = await fetch(
      'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
      {
        headers: {
          'Accept': 'application/json',
          'X_REPLIT_TOKEN': xReplitToken
        }
      }
    ).then(res => res.json()).then(data => data.items?.[0]);

    const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

    if (!connectionSettings || !accessToken) {
      throw new Error('GitHub not connected');
    }
    return accessToken;
  }

  // WARNING: Never cache this client.
  // Access tokens expire, so a new client must be created each time.
  // Always call this function again to get a fresh client.
  async function getUncachableGitHubClient() {
    const accessToken = await getAccessToken();
    return new Octokit({ auth: accessToken });
  }

  // Import Routes
  
  // GitHub Repository Import
  app.post("/api/import/github", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = githubImportSchema.parse(req.body);
      
      // Check if user is a member of the target workspace
      const isMember = await storage.isWorkspaceMember(validatedData.workspaceId, userId);
      if (!isMember) {
        return res.status(403).json({ error: "Access denied to workspace" });
      }

      // Get GitHub client
      let octokit;
      try {
        octokit = await getUncachableGitHubClient();
      } catch (error) {
        return res.status(401).json({ 
          error: "GitHub not connected", 
          message: "Please connect your GitHub account in integrations." 
        });
      }

      // Parse repository URL to extract owner and repo
      let repoOwner: string, repoName: string;
      try {
        const url = new URL(validatedData.repositoryUrl);
        const pathParts = url.pathname.split('/').filter(part => part.length > 0);
        if (pathParts.length < 2) {
          throw new Error("Invalid repository URL format");
        }
        repoOwner = pathParts[0];
        repoName = pathParts[1].replace(/\.git$/, '');
      } catch (error) {
        return res.status(400).json({ 
          error: "Invalid repository URL", 
          message: "Please provide a valid GitHub repository URL." 
        });
      }

      // Validate repository access and fetch metadata
      let repoData;
      try {
        const { data } = await octokit.rest.repos.get({
          owner: repoOwner,
          repo: repoName,
        });
        repoData = data;
      } catch (error: any) {
        if (error.status === 404) {
          return res.status(404).json({ 
            error: "Repository not found", 
            message: "The repository does not exist or you don't have access to it." 
          });
        }
        console.error("Error fetching repository:", error);
        return res.status(500).json({ 
          error: "Failed to access repository", 
          message: "Unable to fetch repository information from GitHub." 
        });
      }

      // Validate branch exists
      try {
        await octokit.rest.repos.getBranch({
          owner: repoOwner,
          repo: repoName,
          branch: validatedData.branch,
        });
      } catch (error: any) {
        if (error.status === 404) {
          return res.status(404).json({ 
            error: "Branch not found", 
            message: `Branch "${validatedData.branch}" does not exist in the repository.` 
          });
        }
        console.error("Error fetching branch:", error);
        return res.status(500).json({ 
          error: "Failed to validate branch", 
          message: "Unable to validate the specified branch." 
        });
      }

      // Create project with import metadata
      const projectData = {
        workspaceId: validatedData.workspaceId,
        title: validatedData.projectName,
        description: validatedData.projectDescription || repoData.description || `Imported from ${repoData.full_name}`,
        category: validatedData.category,
        isPrivate: validatedData.isPrivate ? 'true' : 'false',
        importSource: 'github' as const,
        importUrl: validatedData.repositoryUrl,
        importBranch: validatedData.branch,
      };

      const project = await storage.createProject(projectData);

      res.status(201).json({
        ...project,
        message: "Repository imported successfully",
        sourceRepository: {
          name: repoData.name,
          fullName: repoData.full_name,
          description: repoData.description,
          language: repoData.language,
          stars: repoData.stargazers_count,
          forks: repoData.forks_count,
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: error.errors 
        });
      }
      console.error("Error importing GitHub repository:", error);
      res.status(500).json({ error: "Failed to import repository" });
    }
  });

  // Multer configuration for ZIP file uploads
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB limit
      files: 1, // Only one file at a time
    },
    fileFilter: (req, file, cb) => {
      // Validate file type
      if (file.mimetype === 'application/zip' || 
          file.mimetype === 'application/x-zip-compressed' ||
          file.originalname.toLowerCase().endsWith('.zip')) {
        cb(null, true);
      } else {
        cb(new Error('Only ZIP files are allowed'));
      }
    },
  });

  // ZIP File Import
  app.post("/api/import/zip", isAuthenticated, upload.single('zipFile'), async (req: any, res) => {
    let tempDir: string | null = null;
    
    try {
      const userId = req.user.claims.sub;
      
      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({ 
          error: "No file uploaded", 
          message: "Please select a ZIP file to upload." 
        });
      }

      // Parse and validate form data
      let validatedData;
      try {
        const formData = {
          workspaceId: req.body.workspaceId,
          projectName: req.body.projectName,
          projectDescription: req.body.projectDescription,
          category: req.body.category || 'web',
          isPrivate: req.body.isPrivate === 'true' || req.body.isPrivate === true,
        };
        validatedData = zipImportSchema.parse(formData);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ 
            error: "Validation failed", 
            details: error.errors 
          });
        }
        throw error;
      }
      
      // Check if user is a member of the target workspace
      const isMember = await storage.isWorkspaceMember(validatedData.workspaceId, userId);
      if (!isMember) {
        return res.status(403).json({ error: "Access denied to workspace" });
      }

      // Create temporary directory for extraction
      tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'zip-import-'));
      
      // Extract ZIP file
      let zip: AdmZip;
      let zipEntries: AdmZip.IZipEntry[];
      
      try {
        zip = new AdmZip(req.file.buffer);
        zipEntries = zip.getEntries();
        
        // Validate ZIP file has content
        if (zipEntries.length === 0) {
          return res.status(400).json({ 
            error: "Empty ZIP file", 
            message: "The uploaded ZIP file is empty or corrupted." 
          });
        }

        // Check for security issues (path traversal attacks)
        for (const entry of zipEntries) {
          const entryPath = entry.entryName;
          if (entryPath.includes('..') || path.isAbsolute(entryPath)) {
            return res.status(400).json({ 
              error: "Invalid ZIP file", 
              message: "ZIP file contains invalid file paths." 
            });
          }
        }

        // Extract all files
        zip.extractAllTo(tempDir, true);
        
      } catch (error) {
        console.error("Error extracting ZIP file:", error);
        return res.status(400).json({ 
          error: "Invalid ZIP file", 
          message: "Unable to extract ZIP file. The file may be corrupted." 
        });
      }

      // Analyze extracted content
      const extractedFiles = await getFileStructure(tempDir);
      const projectLanguage = detectProjectLanguage(extractedFiles);
      
      // Create project with import metadata
      const projectData = {
        workspaceId: validatedData.workspaceId,
        title: validatedData.projectName,
        description: validatedData.projectDescription || `Imported from ${req.file.originalname}`,
        category: validatedData.category,
        isPrivate: validatedData.isPrivate ? 'true' : 'false',
        importSource: 'zip' as const,
        importUrl: null, // No URL for ZIP uploads
        importBranch: null, // No branch for ZIP uploads
      };

      const project = await storage.createProject(projectData);

      // Clean up temporary directory
      if (tempDir) {
        await fs.rm(tempDir, { recursive: true, force: true });
        tempDir = null;
      }

      res.status(201).json({
        ...project,
        message: "ZIP file imported successfully",
        extractedInfo: {
          fileName: req.file.originalname,
          fileSize: req.file.size,
          extractedFiles: extractedFiles.length,
          detectedLanguage: projectLanguage,
        }
      });

    } catch (error) {
      // Clean up temporary directory on error
      if (tempDir) {
        try {
          await fs.rm(tempDir, { recursive: true, force: true });
        } catch (cleanupError) {
          console.error("Error cleaning up temporary directory:", cleanupError);
        }
      }

      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: error.errors 
        });
      }
      
      console.error("Error importing ZIP file:", error);
      res.status(500).json({ 
        error: "Failed to import ZIP file",
        message: error instanceof Error ? error.message : "An unexpected error occurred"
      });
    }
  });

  // Helper function to get file structure
  async function getFileStructure(dirPath: string): Promise<string[]> {
    const files: string[] = [];
    
    async function scanDirectory(currentPath: string, relativePath: string = '') {
      const entries = await fs.readdir(currentPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);
        const relativeFile = relativePath ? path.join(relativePath, entry.name) : entry.name;
        
        if (entry.isDirectory()) {
          await scanDirectory(fullPath, relativeFile);
        } else {
          files.push(relativeFile);
        }
      }
    }
    
    await scanDirectory(dirPath);
    return files;
  }

  // Helper function to detect project language/type
  function detectProjectLanguage(files: string[]): string {
    const fileExtensions = files.map(file => path.extname(file).toLowerCase());
    const filenames = files.map(file => path.basename(file).toLowerCase());
    
    // Check for specific project files
    if (filenames.includes('package.json')) return 'JavaScript/Node.js';
    if (filenames.includes('requirements.txt') || filenames.includes('pyproject.toml')) return 'Python';
    if (filenames.includes('cargo.toml')) return 'Rust';
    if (filenames.includes('go.mod')) return 'Go';
    if (filenames.includes('composer.json')) return 'PHP';
    if (filenames.includes('gemfile')) return 'Ruby';
    if (filenames.includes('pom.xml') || filenames.includes('build.gradle')) return 'Java';
    if (filenames.includes('mix.exs')) return 'Elixir';
    
    // Check by file extensions
    if (fileExtensions.includes('.js') || fileExtensions.includes('.ts') || fileExtensions.includes('.jsx') || fileExtensions.includes('.tsx')) {
      return 'JavaScript/TypeScript';
    }
    if (fileExtensions.includes('.py')) return 'Python';
    if (fileExtensions.includes('.rs')) return 'Rust';
    if (fileExtensions.includes('.go')) return 'Go';
    if (fileExtensions.includes('.php')) return 'PHP';
    if (fileExtensions.includes('.rb')) return 'Ruby';
    if (fileExtensions.includes('.java')) return 'Java';
    if (fileExtensions.includes('.cpp') || fileExtensions.includes('.c') || fileExtensions.includes('.h')) return 'C/C++';
    if (fileExtensions.includes('.cs')) return 'C#';
    if (fileExtensions.includes('.html') || fileExtensions.includes('.css')) return 'Web';
    
    return 'Unknown';
  }

  // Template routes
  
  // Get all templates
  app.get("/api/templates", isAuthenticated, async (req: any, res) => {
    try {
      const { category, search } = req.query;
      
      let templates;
      if (search) {
        templates = await storage.searchTemplates(search as string, category as string);
      } else if (category) {
        templates = await storage.getTemplatesByCategory(category as string);
      } else {
        templates = await storage.getAllTemplates();
      }
      
      res.json(templates);
    } catch (error) {
      console.error("Error fetching templates:", error);
      res.status(500).json({ error: "Failed to fetch templates" });
    }
  });

  // Clone a template to create a new project
  app.post("/api/import/clone", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = templateCloneSchema.parse(req.body);
      
      // Check if user is a member of the target workspace
      const isMember = await storage.isWorkspaceMember(validatedData.workspaceId, userId);
      if (!isMember) {
        return res.status(403).json({ error: "Access denied to workspace" });
      }

      // Get the template
      const template = await storage.getTemplate(validatedData.templateId);
      if (!template) {
        return res.status(404).json({ 
          error: "Template not found", 
          message: "The selected template could not be found." 
        });
      }

      // Create new project based on template
      const project = await storage.createProject({
        workspaceId: validatedData.workspaceId,
        title: validatedData.projectName,
        description: validatedData.projectDescription || template.description,
        category: template.category,
        isPrivate: validatedData.isPrivate ? 'true' : 'false',
        backgroundColor: template.backgroundColor,
        importSource: 'clone',
        importUrl: `template:${template.id}`,
        importBranch: null,
      });

      // Increment template usage count
      await storage.incrementTemplateUsage(template.id);

      res.status(201).json({
        ...project,
        message: "Template cloned successfully",
        sourceTemplate: {
          id: template.id,
          title: template.title,
          category: template.category
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: error.errors 
        });
      }
      
      console.error("Error cloning template:", error);
      res.status(500).json({ 
        error: "Failed to clone template",
        message: error instanceof Error ? error.message : "An unexpected error occurred"
      });
    }
  });

  // Planning chat routes
  app.post('/api/chat/planning', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = planningChatSchema.parse(req.body);
      
      // Check if user is a member of the workspace
      const isMember = await storage.isWorkspaceMember(validatedData.workspaceId, userId);
      if (!isMember) {
        return res.status(403).json({ error: "Access denied to workspace" });
      }

      let conversation;
      let messages: any[] = [];

      // Get or create conversation
      if (validatedData.conversationId) {
        conversation = await storage.getChatConversation(validatedData.conversationId);
        if (!conversation || conversation.userId !== userId) {
          return res.status(404).json({ error: "Conversation not found" });
        }
        messages = await storage.getConversationMessages(conversation.id);
      } else {
        // Create new conversation
        conversation = await storage.createChatConversation({
          userId,
          workspaceId: validatedData.workspaceId,
          status: 'active',
          phase: 'planning',
          projectIdea: validatedData.message,
        });
      }

      // Add user message to conversation
      const userMessage = await storage.createChatMessage({
        conversationId: conversation.id,
        role: 'user',
        content: validatedData.message,
        messageIndex: messages.length.toString(),
      });

      // Prepare conversation history for OpenAI
      const conversationHistory = [
        {
          role: 'system',
          content: `You are Replie, an AI assistant helping users plan Replit projects. You are helpful, enthusiastic, and knowledgeable about web development, coding, and project planning.

Your role is to:
1. Help users clarify their project ideas
2. Ask thoughtful questions to understand their needs
3. Propose comprehensive project plans with tech stacks
4. Guide them toward choosing between Design Mode or Build Mode

Keep responses conversational, friendly, and focused on planning. Ask 2-3 clarifying questions before proposing a full plan. When you have enough information, provide a detailed plan and offer the choice between Design Mode (for prototyping) or Build Mode (for full development).`
        },
        ...messages.map((msg: any) => ({
          role: msg.role,
          content: msg.content,
        })),
        {
          role: 'user',
          content: validatedData.message,
        }
      ];

      // Get OpenAI response
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: conversationHistory as any,
        max_tokens: 500,
        temperature: 0.7,
      });

      const assistantResponse = completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response. Please try again.";

      // Save assistant response
      const assistantMessage = await storage.createChatMessage({
        conversationId: conversation.id,
        role: 'assistant',
        content: assistantResponse,
        messageIndex: (messages.length + 1).toString(),
      });

      // Check if we should transition to mode selection phase
      const shouldShowModeSelection = assistantResponse.toLowerCase().includes('design mode') && 
                                    assistantResponse.toLowerCase().includes('build mode');

      if (shouldShowModeSelection) {
        await storage.updateChatConversation(conversation.id, {
          phase: 'mode_selection',
          finalPlan: assistantResponse,
        });
      }

      res.json({
        conversation,
        userMessage,
        assistantMessage,
        showModeSelection: shouldShowModeSelection,
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Validation failed",
          details: error.errors
        });
      }
      console.error("Error in planning chat:", error);
      res.status(500).json({ error: "Failed to process chat message" });
    }
  });

  // Mode selection route
  app.post('/api/chat/mode-selection', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = modeSelectionSchema.parse(req.body);
      
      const conversation = await storage.getChatConversation(validatedData.conversationId);
      if (!conversation || conversation.userId !== userId) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      // Update conversation with selected mode
      const updatedConversation = await storage.updateChatConversation(conversation.id, {
        selectedMode: validatedData.selectedMode,
        phase: 'completed',
        status: 'completed',
      });

      res.json({
        conversation: updatedConversation,
        message: `Great! You've selected ${validatedData.selectedMode} mode. This is where the ${validatedData.selectedMode === 'design' ? 'design editor' : 'code editor'} would open.`
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Validation failed",
          details: error.errors
        });
      }
      console.error("Error in mode selection:", error);
      res.status(500).json({ error: "Failed to process mode selection" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
