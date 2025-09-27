import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProjectSchema, insertAppSchema, insertWorkspaceSchema, insertWorkspaceMemberSchema, createTeamSchema, updateProfileSchema, githubImportSchema, zipImportSchema, templateCloneSchema, planningChatSchema, modeSelectionSchema, appFileContentSchema, appFileSaveSchema, appFilesSaveSchema, agentRequestSchema } from "@shared/schema";
import OpenAI from 'openai';
import { ObjectStorageService, ObjectNotFoundError, objectStorageClient } from './objectStorage';
import { setupAuth, isAuthenticated } from "./replitAuth";
import { GitService } from './gitService';
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

  // Initialize Object Storage Service
  const objectStorageService = new ObjectStorageService();

  // Initialize Git Service
  const gitService = new GitService();

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
        
        // Note: Email invitations will be implemented in future iterations
        // For now, emails are processed but not sent
      }
      
      // Note: Billing integration will be implemented in future iterations
      
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

  // App File Management Routes
  
  // Helper function to parse object storage path  
  function parseObjectPath(fullPath: string): { bucketName: string; objectName: string } {
    const pathParts = fullPath.split('/').filter(part => part.length > 0);
    if (pathParts.length < 2) {
      throw new Error('Invalid object path format');
    }
    const bucketName = pathParts[0];
    const objectName = pathParts.slice(1).join('/');
    return { bucketName, objectName };
  }

  // Helper function to get app file starter templates
  function getStarterTemplates(): Record<string, string> {
    return {
      'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My App</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <h1>Welcome to My App</h1>
        <p>Edit this content to build your application!</p>
        <button id="demo-btn">Click me!</button>
    </div>
    <script src="script.js"></script>
</body>
</html>`,
      'styles.css': `/* App Styles */
body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    margin: 0;
    padding: 20px;
    background-color: #0d1117;
    color: #e6edf3;
}

.container {
    max-width: 800px;
    margin: 0 auto;
    text-align: center;
}

h1 {
    color: #79c0ff;
    margin-bottom: 20px;
}

button {
    background-color: #238636;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 16px;
}

button:hover {
    background-color: #2ea043;
}`,
      'script.js': `// App JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const button = document.getElementById('demo-btn');
    
    button.addEventListener('click', function() {
        alert('Hello from your app!');
    });
    
});`,
      'db.json': `{
  "users": [],
  "posts": [],
  "settings": {
    "theme": "dark",
    "version": "1.0.0"
  }
}`
    };
  }

  // Initialize app files in object storage
  app.post("/api/apps/:appId/initialize", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const appId = req.params.appId;
      
      const app = await storage.getApp(appId);
      if (!app) {
        return res.status(404).json({ error: "App not found" });
      }
      
      // Check if user is a member of the app's workspace
      const isMember = await storage.isWorkspaceMember(app.workspaceId, userId);
      if (!isMember) {
        return res.status(403).json({ error: "Access denied to app" });
      }
      
      // Skip if already initialized
      if (app.filesInitialized === 'true') {
        return res.json({ 
          message: "App files already initialized",
          gitStatus: {
            gitInitialized: app.gitInitialized === 'true',
            gitBranch: app.gitBranch,
            lastCommitSha: app.lastCommitSha,
            lastCommitMessage: app.lastCommitMessage,
            lastCommitAuthor: app.lastCommitAuthor,
            lastCommitDate: app.lastCommitDate
          }
        });
      }
      
      // Create object storage path for this app
      const privateDir = objectStorageService.getPrivateObjectDir();
      const appPath = `${privateDir}/apps/${appId}`;
      
      try {
        // Create starter files
        const templates = getStarterTemplates();
        const { bucketName } = parseObjectPath(appPath);
        const bucket = objectStorageClient.bucket(bucketName);
        
        // Upload each starter file
        for (const [filename, content] of Object.entries(templates)) {
          const objectName = `${appPath.split('/').slice(1).join('/')}/${filename}`;
          const file = bucket.file(objectName);
          await file.save(content, {
            metadata: { contentType: getContentType(filename) }
          });
        }
        
        // Update app record with file initialization
        await storage.initializeAppFiles(appId, appPath);
        
        // Initialize Git repository
        let gitStatus = {
          gitInitialized: false,
          gitBranch: 'main',
          lastCommitSha: null as string | null,
          lastCommitMessage: null as string | null,
          lastCommitAuthor: null as string | null,
          lastCommitDate: null as Date | null
        };
        
        try {
          // Extract user information for Git commits
          const userClaims = req.user.claims;
          const gitAuthor = {
            name: userClaims.first_name && userClaims.last_name 
              ? `${userClaims.first_name} ${userClaims.last_name}` 
              : userClaims.name || 'User',
            email: userClaims.email || 'user@example.com'
          };
          
          // Initialize Git repository with starter files
          const initialCommitSha = await gitService.initializeRepository(
            appId,
            appPath,
            gitAuthor
          );
          
          // Update git status
          gitStatus = {
            gitInitialized: true,
            gitBranch: 'main',
            lastCommitSha: initialCommitSha,
            lastCommitMessage: 'Initial commit',
            lastCommitAuthor: `${gitAuthor.name} <${gitAuthor.email}>`,
            lastCommitDate: new Date()
          };
          
          // Update app record with Git metadata
          await storage.updateApp(appId, {
            gitInitialized: 'true',
            gitBranch: 'main',
            lastCommitSha: initialCommitSha,
            lastCommitMessage: 'Initial commit',
            lastCommitAuthor: `${gitAuthor.name} <${gitAuthor.email}>`,
            lastCommitDate: new Date()
          });
          
          console.log(`Git repository initialized successfully for app ${appId} with commit ${initialCommitSha}`);
        } catch (gitError) {
          console.error(`Failed to initialize Git repository for app ${appId}:`, gitError);
          
          // Update app record to indicate Git initialization failed
          await storage.updateApp(appId, {
            gitInitialized: 'false',
            gitBranch: 'main'
          });
          
          // Git failure shouldn't prevent app file initialization from being successful
          // Just log the error and continue
        }
        
        res.json({ 
          message: "App files initialized successfully", 
          objectStoragePath: appPath,
          gitStatus: gitStatus
        });
      } catch (error) {
        console.error("Error initializing app files:", error);
        res.status(500).json({ error: "Failed to initialize app files" });
      }
    } catch (error) {
      console.error("Error initializing app:", error);
      res.status(500).json({ error: "Failed to initialize app" });
    }
  });

  // List all files for an app
  app.get("/api/apps/:appId/files", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const appId = req.params.appId;
      
      const app = await storage.getApp(appId);
      if (!app) {
        return res.status(404).json({ error: "App not found" });
      }
      
      // Check if user is a member of the app's workspace
      const isMember = await storage.isWorkspaceMember(app.workspaceId, userId);
      if (!isMember) {
        return res.status(403).json({ error: "Access denied to app" });
      }
      
      if (!app.objectStoragePath) {
        return res.json({ files: [] });
      }
      
      const { bucketName } = parseObjectPath(app.objectStoragePath);
      const bucket = objectStorageClient.bucket(bucketName);
      const prefix = `${app.objectStoragePath.split('/').slice(1).join('/')}/`;
      
      const [files] = await bucket.getFiles({ prefix });
      const fileList = files
        .filter(file => file.name.endsWith('.html') || file.name.endsWith('.css') || file.name.endsWith('.js') || file.name.endsWith('.json'))
        .map(file => ({
          name: file.name.split('/').pop(),
          path: file.name,
          size: file.metadata.size,
          lastModified: file.metadata.updated
        }));
      
      res.json({ files: fileList });
    } catch (error) {
      console.error("Error listing app files:", error);
      res.status(500).json({ error: "Failed to list app files" });
    }
  });

  // Get specific file content
  app.get("/api/apps/:appId/files/:filename", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const appId = req.params.appId;
      const filename = req.params.filename;
      
      // Validate filename
      const allowedFiles = ['index.html', 'styles.css', 'script.js', 'db.json'];
      if (!allowedFiles.includes(filename)) {
        return res.status(400).json({ error: "Invalid filename" });
      }
      
      const app = await storage.getApp(appId);
      if (!app) {
        return res.status(404).json({ error: "App not found" });
      }
      
      // Check if user is a member of the app's workspace
      const isMember = await storage.isWorkspaceMember(app.workspaceId, userId);
      if (!isMember) {
        return res.status(403).json({ error: "Access denied to app" });
      }
      
      if (!app.objectStoragePath) {
        return res.status(404).json({ error: "App files not initialized" });
      }
      
      const { bucketName } = parseObjectPath(app.objectStoragePath);
      const bucket = objectStorageClient.bucket(bucketName);
      const objectName = `${app.objectStoragePath.split('/').slice(1).join('/')}/${filename}`;
      const file = bucket.file(objectName);
      
      try {
        const [content] = await file.download();
        res.json({ content: content.toString('utf8') });
      } catch (error: any) {
        if (error.code === 404) {
          return res.status(404).json({ error: "File not found" });
        }
        throw error;
      }
    } catch (error) {
      console.error("Error reading app file:", error);
      res.status(500).json({ error: "Failed to read app file" });
    }
  });

  // Save specific file content
  app.put("/api/apps/:appId/files/:filename", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const appId = req.params.appId;
      const filename = req.params.filename;
      
      // Validate filename
      const allowedFiles = ['index.html', 'styles.css', 'script.js', 'db.json'];
      if (!allowedFiles.includes(filename)) {
        return res.status(400).json({ error: "Invalid filename" });
      }
      
      const validatedData = appFileContentSchema.parse(req.body);
      
      const app = await storage.getApp(appId);
      if (!app) {
        return res.status(404).json({ error: "App not found" });
      }
      
      // Check if user is a member of the app's workspace
      const isMember = await storage.isWorkspaceMember(app.workspaceId, userId);
      if (!isMember) {
        return res.status(403).json({ error: "Access denied to app" });
      }
      
      if (!app.objectStoragePath) {
        return res.status(404).json({ error: "App files not initialized" });
      }
      
      const { bucketName } = parseObjectPath(app.objectStoragePath);
      const bucket = objectStorageClient.bucket(bucketName);
      const objectName = `${app.objectStoragePath.split('/').slice(1).join('/')}/${filename}`;
      const file = bucket.file(objectName);
      
      await file.save(validatedData.content, {
        metadata: { contentType: getContentType(filename) }
      });
      
      res.json({ message: "File saved successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: error.errors 
        });
      }
      console.error("Error saving app file:", error);
      res.status(500).json({ error: "Failed to save app file" });
    }
  });

  // Save all app files
  app.post("/api/apps/:appId/save", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const appId = req.params.appId;
      const validatedData = appFilesSaveSchema.parse(req.body);
      
      const app = await storage.getApp(appId);
      if (!app) {
        return res.status(404).json({ error: "App not found" });
      }
      
      // Check if user is a member of the app's workspace
      const isMember = await storage.isWorkspaceMember(app.workspaceId, userId);
      if (!isMember) {
        return res.status(403).json({ error: "Access denied to app" });
      }
      
      if (!app.objectStoragePath) {
        return res.status(404).json({ error: "App files not initialized" });
      }
      
      const { bucketName } = parseObjectPath(app.objectStoragePath);
      const bucket = objectStorageClient.bucket(bucketName);
      
      // Save each file to object storage
      const savePromises = Object.entries(validatedData.files).map(async ([filename, content]) => {
        const allowedFiles = ['index.html', 'styles.css', 'script.js', 'db.json'];
        if (!allowedFiles.includes(filename)) {
          throw new Error(`Invalid filename: ${filename}`);
        }
        
        const objectName = `${app.objectStoragePath!.split('/').slice(1).join('/')}/${filename}`;
        const file = bucket.file(objectName);
        await file.save(content, {
          metadata: { contentType: getContentType(filename) }
        });
      });
      
      await Promise.all(savePromises);
      
      // Prepare response object
      let response: any = { 
        message: "All files saved successfully",
        gitCommitStatus: "skipped" // Default status
      };
      
      // Only attempt Git operations if Git is initialized for this app
      if (app.gitInitialized === 'true' && app.objectStoragePath) {
        try {
          // Determine author information and commit message based on request context
          let author: { name: string; email: string };
          let commitMessage: string;
          
          if (validatedData.agentContext) {
            // Agent-driven changes
            const agentType = validatedData.agentContext.agentType;
            const agentName = validatedData.agentContext.agentName;
            const actionDescription = validatedData.agentContext.actionDescription;
            
            author = {
              name: `${agentName} (${agentType})`,
              email: `${agentType}@replie.system`
            };
            
            // Generate descriptive commit message for agent changes
            const fileList = Object.keys(validatedData.files).join(', ');
            commitMessage = `Agent: ${agentType} - ${actionDescription || 'Modified files'}`;
            commitMessage += `\n\nFiles changed: ${fileList}`;
          } else {
            // User-driven changes
            const userClaims = req.user.claims;
            author = {
              name: `${userClaims.first_name || 'User'} ${userClaims.last_name || ''}`.trim(),
              email: userClaims.email || 'user@replie.system'
            };
            
            // Use custom commit message or generate a default one
            if (validatedData.commitMessage) {
              commitMessage = validatedData.commitMessage;
            } else {
              const fileList = Object.keys(validatedData.files).join(', ');
              commitMessage = `User: Manual file updates\n\nFiles changed: ${fileList}`;
            }
          }
          
          // Create Git commit using GitService
          const commitSha = await gitService.commitChanges(
            appId,
            app.objectStoragePath,
            validatedData.files,
            author,
            commitMessage
          );
          
          // Update app record with new Git metadata
          await storage.updateApp(appId, {
            lastCommitSha: commitSha,
            lastCommitMessage: commitMessage,
            lastCommitAuthor: `${author.name} <${author.email}>`,
            lastCommitDate: new Date()
          });
          
          response.gitCommitStatus = "success";
          response.commitSha = commitSha;
          response.commitMessage = commitMessage;
          response.commitAuthor = `${author.name} <${author.email}>`;
          
        } catch (gitError) {
          // Log Git error but don't fail the file save operation
          console.error(`Git commit failed for app ${appId}:`, gitError);
          response.gitCommitStatus = "failed";
          response.gitError = gitError instanceof Error ? gitError.message : 'Unknown Git error';
        }
      }
      
      res.json(response);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: error.errors 
        });
      }
      console.error("Error saving app files:", error);
      res.status(500).json({ error: "Failed to save app files" });
    }
  });

  // Helper function to get content type
  function getContentType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'html': return 'text/html';
      case 'css': return 'text/css';
      case 'js': return 'application/javascript';
      case 'json': return 'application/json';
      default: return 'text/plain';
    }
  }

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

  // Agent system prompts
  const getAgentSystemPrompt = (agentType: string): string => {
    const prompts: Record<string, string> = {
      manager: `You are the Manager Agent responsible for coordinating the multi-agent system.
Your role is to:
- Analyze incoming requests and determine the best agent to handle them
- Break down complex tasks into manageable subtasks
- Coordinate between different agents
- Ensure tasks are completed efficiently
- Make strategic decisions about approach and priority

Always respond in a structured format with clear reasoning about your decisions.`,

      editor: `You are the Editor Agent specialized in making direct code changes and file modifications.
Your role is to:
- Implement specific code changes and edits
- Create, modify, and delete files as needed
- Write clean, functional code that meets requirements
- Focus on practical implementation rather than planning
- Make precise, targeted changes with clear explanations

Provide specific, actionable code changes and file modifications.`,

      architect: `You are the Architect Agent specialized in system design and structural decisions.
Your role is to:
- Analyze code architecture and patterns
- Recommend structural improvements
- Design scalable solutions
- Identify technical debt and refactoring opportunities
- Provide high-level design guidance

Focus on architectural decisions and structural improvements.`,

      advisor: `You are the Advisor Agent specialized in providing recommendations and best practices.
Your role is to:
- Offer expert advice on development decisions
- Suggest best practices and patterns
- Provide learning resources and explanations
- Help with technology choices and approaches
- Guide users toward optimal solutions

Provide clear, actionable advice with explanations and best practices.`,

      shepherd: `You are the Shepherd Agent responsible for guiding processes and ensuring completion.
Your role is to:
- Monitor task progress and quality
- Ensure all requirements are met
- Guide users through complex workflows
- Validate implementations and suggest improvements
- Keep projects on track and organized

Focus on process guidance, quality assurance, and task completion.`
    };

    return prompts[agentType] || 'You are an AI assistant helping with development tasks.';
  };

  // Helper function to build conversation for OpenAI
  const buildAgentConversation = (agentType: string, userMessage: string, fileContents: Record<string, string>, conversationHistory: any[]): any[] => {
    const messages = [];

    // System prompt
    messages.push({
      role: 'system',
      content: getAgentSystemPrompt(agentType)
    });

    // Add conversation history (limit to last 10 messages to avoid token limits)
    const recentHistory = conversationHistory.slice(-10);
    messages.push(...recentHistory.map(msg => ({
      role: msg.role,
      content: msg.content
    })));

    // Current context and file contents
    const fileContext = Object.keys(fileContents).length > 0 
      ? `\n\nCurrent files:\n${Object.entries(fileContents)
          .map(([filename, content]) => `**${filename}:**\n\`\`\`\n${content}\n\`\`\``)
          .join('\n\n')}`
      : '';

    // User message with context
    messages.push({
      role: 'user',
      content: `${userMessage}${fileContext}`
    });

    return messages;
  };

  // Helper function to parse agent response into structured format
  const parseAgentResponse = (responseContent: string, agentType: string): any => {
    // Basic response structure
    const response: any = {
      content: responseContent,
      actions: [] as any[],
      shouldDelegate: undefined as any,
      completed: true
    };

    // Check for delegation keywords
    const delegationKeywords = ['delegate', 'hand off', 'refer to', 'should handle'];
    const agentTypes = ['manager', 'editor', 'architect', 'advisor', 'shepherd'];
    
    const lowerContent = responseContent.toLowerCase();
    
    if (delegationKeywords.some(keyword => lowerContent.includes(keyword))) {
      for (const targetAgent of agentTypes) {
        if (targetAgent !== agentType && lowerContent.includes(targetAgent)) {
          response.shouldDelegate = {
            to: targetAgent,
            reason: `Delegation suggested by ${agentType} agent`,
            context: 'Task requires specialized expertise'
          };
          response.completed = false;
          break;
        }
      }
    }

    // Parse actions from response (basic pattern matching)
    if (agentType === 'editor') {
      // Look for file editing patterns
      const fileEditPattern = /(?:edit|modify|update|change)\s+([^\s]+\.(?:html|css|js|json))/gi;
      let match;
      while ((match = fileEditPattern.exec(responseContent)) !== null) {
        response.actions.push({
          type: 'file_edit',
          target: match[1],
          content: 'See response for details',
          reason: 'File modification requested'
        });
      }
    }

    return response;
  };

  // Agent endpoints
  app.post('/api/agents/manager', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = agentRequestSchema.parse(req.body);
      
      // Check workspace access
      const isMember = await storage.isWorkspaceMember(validatedData.workspaceId, userId);
      if (!isMember) {
        return res.status(403).json({ error: "Access denied to workspace" });
      }

      // Check app access
      const app = await storage.getApp(validatedData.appId);
      if (!app || app.workspaceId !== validatedData.workspaceId) {
        return res.status(404).json({ error: "App not found" });
      }

      // Build conversation for OpenAI
      const messages = buildAgentConversation('manager', validatedData.userMessage, validatedData.fileContents, validatedData.conversationHistory);

      // Get OpenAI response
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: messages,
        max_tokens: 800,
        temperature: 0.7,
      });

      const responseContent = completion.choices[0]?.message?.content || "I couldn't generate a response. Please try again.";
      const agentResponse = parseAgentResponse(responseContent, 'manager');

      res.json(agentResponse);

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Validation failed",
          details: error.errors
        });
      }
      console.error("Error in manager agent:", error);
      res.status(500).json({ error: "Failed to process manager agent request" });
    }
  });

  app.post('/api/agents/editor', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = agentRequestSchema.parse(req.body);
      
      // Check workspace access
      const isMember = await storage.isWorkspaceMember(validatedData.workspaceId, userId);
      if (!isMember) {
        return res.status(403).json({ error: "Access denied to workspace" });
      }

      // Check app access
      const app = await storage.getApp(validatedData.appId);
      if (!app || app.workspaceId !== validatedData.workspaceId) {
        return res.status(404).json({ error: "App not found" });
      }

      // Build conversation for OpenAI
      const messages = buildAgentConversation('editor', validatedData.userMessage, validatedData.fileContents, validatedData.conversationHistory);

      // Get OpenAI response
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: messages,
        max_tokens: 1000,
        temperature: 0.5,
      });

      const responseContent = completion.choices[0]?.message?.content || "I couldn't generate a response. Please try again.";
      const agentResponse = parseAgentResponse(responseContent, 'editor');

      res.json(agentResponse);

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Validation failed",
          details: error.errors
        });
      }
      console.error("Error in editor agent:", error);
      res.status(500).json({ error: "Failed to process editor agent request" });
    }
  });

  app.post('/api/agents/architect', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = agentRequestSchema.parse(req.body);
      
      // Check workspace access
      const isMember = await storage.isWorkspaceMember(validatedData.workspaceId, userId);
      if (!isMember) {
        return res.status(403).json({ error: "Access denied to workspace" });
      }

      // Check app access
      const app = await storage.getApp(validatedData.appId);
      if (!app || app.workspaceId !== validatedData.workspaceId) {
        return res.status(404).json({ error: "App not found" });
      }

      // Build conversation for OpenAI
      const messages = buildAgentConversation('architect', validatedData.userMessage, validatedData.fileContents, validatedData.conversationHistory);

      // Get OpenAI response
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: messages,
        max_tokens: 1000,
        temperature: 0.6,
      });

      const responseContent = completion.choices[0]?.message?.content || "I couldn't generate a response. Please try again.";
      const agentResponse = parseAgentResponse(responseContent, 'architect');

      res.json(agentResponse);

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Validation failed",
          details: error.errors
        });
      }
      console.error("Error in architect agent:", error);
      res.status(500).json({ error: "Failed to process architect agent request" });
    }
  });

  app.post('/api/agents/advisor', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = agentRequestSchema.parse(req.body);
      
      // Check workspace access
      const isMember = await storage.isWorkspaceMember(validatedData.workspaceId, userId);
      if (!isMember) {
        return res.status(403).json({ error: "Access denied to workspace" });
      }

      // Check app access
      const app = await storage.getApp(validatedData.appId);
      if (!app || app.workspaceId !== validatedData.workspaceId) {
        return res.status(404).json({ error: "App not found" });
      }

      // Build conversation for OpenAI
      const messages = buildAgentConversation('advisor', validatedData.userMessage, validatedData.fileContents, validatedData.conversationHistory);

      // Get OpenAI response
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: messages,
        max_tokens: 1000,
        temperature: 0.8,
      });

      const responseContent = completion.choices[0]?.message?.content || "I couldn't generate a response. Please try again.";
      const agentResponse = parseAgentResponse(responseContent, 'advisor');

      res.json(agentResponse);

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Validation failed",
          details: error.errors
        });
      }
      console.error("Error in advisor agent:", error);
      res.status(500).json({ error: "Failed to process advisor agent request" });
    }
  });

  app.post('/api/agents/shepherd', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = agentRequestSchema.parse(req.body);
      
      // Check workspace access
      const isMember = await storage.isWorkspaceMember(validatedData.workspaceId, userId);
      if (!isMember) {
        return res.status(403).json({ error: "Access denied to workspace" });
      }

      // Check app access
      const app = await storage.getApp(validatedData.appId);
      if (!app || app.workspaceId !== validatedData.workspaceId) {
        return res.status(404).json({ error: "App not found" });
      }

      // Build conversation for OpenAI
      const messages = buildAgentConversation('shepherd', validatedData.userMessage, validatedData.fileContents, validatedData.conversationHistory);

      // Get OpenAI response
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7,
      });

      const responseContent = completion.choices[0]?.message?.content || "I couldn't generate a response. Please try again.";
      const agentResponse = parseAgentResponse(responseContent, 'shepherd');

      res.json(agentResponse);

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Validation failed",
          details: error.errors
        });
      }
      console.error("Error in shepherd agent:", error);
      res.status(500).json({ error: "Failed to process shepherd agent request" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
