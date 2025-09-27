import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, index, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  bio: text("bio"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Workspaces table - supports personal and team workspaces
export const workspaces = pgTable("workspaces", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'personal' or 'team'
  slug: text("slug").unique().notNull(),
  avatarUrl: text("avatar_url"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Workspace membership table - many-to-many relationship between users and workspaces
export const workspaceMembers = pgTable("workspace_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id").notNull(),
  userId: varchar("user_id").notNull(),
  role: text("role").notNull().default('member'), // 'owner', 'admin', 'member'
  createdAt: timestamp("created_at").defaultNow(),
});

export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(), // 'web', 'data', 'game', 'general', 'agents'
  isPrivate: text("is_private").notNull().default('true'), // 'true' or 'false' as text
  backgroundColor: text("background_color").notNull().default('bg-gradient-to-br from-blue-500 to-purple-600'),
  deploymentStatus: text("deployment_status"), // 'published', 'failed', null
  importSource: text("import_source"), // 'github', 'zip', 'clone', null
  importUrl: text("import_url"), // original repository URL or source
  importBranch: text("import_branch"), // imported branch name
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const apps = pgTable("apps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id").notNull(),
  title: text("title").notNull(),
  creator: text("creator").notNull(),
  isPublished: text("is_published").notNull().default('false'), // 'true' or 'false' as text
  isPrivate: text("is_private").notNull().default('true'), // 'true' or 'false' as text
  backgroundColor: text("background_color").notNull().default('bg-gradient-to-br from-blue-500 to-purple-600'),
  objectStoragePath: text("object_storage_path"), // Base path in object storage for this app's files
  filesInitialized: text("files_initialized").notNull().default('false'), // 'true' or 'false' as text
  // Git repository tracking fields
  gitInitialized: text("git_initialized").notNull().default('false'), // 'true' or 'false' as text to track if Git repo is set up
  gitBranch: text("git_branch").notNull().default('main'), // current branch name
  lastCommitSha: text("last_commit_sha"), // latest commit hash (nullable)
  lastCommitMessage: text("last_commit_message"), // latest commit message (nullable)
  lastCommitAuthor: text("last_commit_author"), // author of the latest commit (nullable)
  lastCommitDate: timestamp("last_commit_date"), // when the last commit was made (nullable)
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Templates table - predefined project templates for cloning
export const templates = pgTable("templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // 'web', 'data', 'game', 'general', 'agents'
  tags: text("tags").array().notNull().default(sql`ARRAY[]::text[]`), // tech stack tags like ['React', 'TypeScript']
  backgroundColor: text("background_color").notNull().default('bg-gradient-to-br from-blue-500 to-purple-600'),
  iconName: text("icon_name"), // lucide icon name for display
  usageCount: text("usage_count").notNull().default('0'), // number of times cloned
  difficulty: text("difficulty").notNull().default('beginner'), // 'beginner', 'intermediate', 'advanced'
  estimatedTime: text("estimated_time"), // e.g. '30 minutes', '2 hours'
  fileStructure: jsonb("file_structure"), // JSON structure representing files and folders
  isOfficial: text("is_official").notNull().default('true'), // 'true' or 'false' for official Replit templates
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Chat conversations table - tracks planning chat sessions
export const chatConversations = pgTable("chat_conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  workspaceId: varchar("workspace_id").notNull(),
  status: text("status").notNull().default('active'), // 'active', 'completed', 'abandoned'
  phase: text("phase").notNull().default('planning'), // 'planning', 'mode_selection', 'completed'
  projectIdea: text("project_idea"), // initial project idea from user
  finalPlan: jsonb("final_plan"), // structured plan generated by AI
  selectedMode: text("selected_mode"), // 'design', 'build', null
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Chat messages table - individual messages in conversations
export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull(),
  role: text("role").notNull(), // 'user', 'assistant'
  content: text("content").notNull(),
  messageIndex: text("message_index").notNull(), // order of message in conversation
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAppSchema = createInsertSchema(apps).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTemplateSchema = createInsertSchema(templates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWorkspaceSchema = createInsertSchema(workspaces).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWorkspaceMemberSchema = createInsertSchema(workspaceMembers).omit({
  id: true,
  createdAt: true,
});

export const insertChatConversationSchema = createInsertSchema(chatConversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertApp = z.infer<typeof insertAppSchema>;
export type App = typeof apps.$inferSelect;
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;
export type Template = typeof templates.$inferSelect;
export type InsertWorkspace = z.infer<typeof insertWorkspaceSchema>;
export type Workspace = typeof workspaces.$inferSelect;
export type InsertWorkspaceMember = z.infer<typeof insertWorkspaceMemberSchema>;
export type WorkspaceMember = typeof workspaceMembers.$inferSelect;
export type InsertChatConversation = z.infer<typeof insertChatConversationSchema>;
export type ChatConversation = typeof chatConversations.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;

// Enhanced workspace member with user details for display
export interface WorkspaceMemberWithUser {
  id: string;
  workspaceId: string;
  role: string;
  createdAt: Date;
  user: {
    id: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
  };
}

// Team creation request schema
export const createTeamSchema = z.object({
  organizationName: z.string().min(1, "Organization name is required"),
  useCase: z.string().min(1, "Use case is required"),
  description: z.string().optional(),
  billingEmail: z.string().email("Valid billing email is required"),
  inviteEmails: z.string().optional(),
  plan: z.enum(["teams", "enterprise"]),
});

export type CreateTeamRequest = z.infer<typeof createTeamSchema>;

// Profile update request schema
export const updateProfileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  bio: z.string().max(140, "Bio must be 140 characters or less").optional(),
});

export type UpdateProfileRequest = z.infer<typeof updateProfileSchema>;

// GitHub import request schema
export const githubImportSchema = z.object({
  repositoryUrl: z.string().url("Must be a valid GitHub repository URL")
    .refine((url) => url.includes('github.com'), "Must be a GitHub repository URL"),
  branch: z.string().min(1, "Branch name is required").default("main"),
  workspaceId: z.string().min(1, "Workspace is required"),
  projectName: z.string().min(1, "Project name is required"),
  projectDescription: z.string().optional(),
  category: z.enum(['web', 'data', 'game', 'general', 'agents']).default('web'),
  isPrivate: z.boolean().default(true),
});

export type GitHubImportRequest = z.infer<typeof githubImportSchema>;

// ZIP import request schema
export const zipImportSchema = z.object({
  workspaceId: z.string().min(1, "Workspace is required"),
  projectName: z.string().min(1, "Project name is required"),
  projectDescription: z.string().optional(),
  category: z.enum(['web', 'data', 'game', 'general', 'agents']).default('web'),
  isPrivate: z.boolean().default(true),
});

export type ZipImportRequest = z.infer<typeof zipImportSchema>;

// Template clone request schema
export const templateCloneSchema = z.object({
  templateId: z.string().min(1, "Template is required"),
  workspaceId: z.string().min(1, "Workspace is required"),
  projectName: z.string().min(1, "Project name is required"),
  projectDescription: z.string().optional(),
  isPrivate: z.boolean().default(true),
});

export type TemplateCloneRequest = z.infer<typeof templateCloneSchema>;

// Planning chat request schema
export const planningChatSchema = z.object({
  message: z.string().min(1, "Message is required"),
  conversationId: z.string().optional(),
  workspaceId: z.string().min(1, "Workspace is required"),
});

export type PlanningChatRequest = z.infer<typeof planningChatSchema>;

// Mode selection request schema
export const modeSelectionSchema = z.object({
  conversationId: z.string().min(1, "Conversation ID is required"),
  selectedMode: z.enum(["design", "build"]),
});

export type ModeSelectionRequest = z.infer<typeof modeSelectionSchema>;

// App file operation schemas
export const appFileContentSchema = z.object({
  content: z.string(),
});

export const appFileSaveSchema = z.object({
  filename: z.enum(["index.html", "styles.css", "script.js", "db.json"]),
  content: z.string(),
});

export const appFilesSaveSchema = z.object({
  files: z.record(z.string(), z.string()), // filename -> content mapping
});

export type AppFileContentRequest = z.infer<typeof appFileContentSchema>;
export type AppFileSaveRequest = z.infer<typeof appFileSaveSchema>;
export type AppFilesSaveRequest = z.infer<typeof appFilesSaveSchema>;

// Agent system schemas
export const agentChatMessageSchema = z.object({
  id: z.string(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  agentType: z.enum(['manager', 'shepherd', 'advisor', 'architect', 'editor']).optional(),
  createdAt: z.string(),
});

export const agentActionSchema = z.object({
  type: z.enum(['file_edit', 'file_create', 'file_delete', 'analysis', 'recommendation']),
  target: z.string(), // filename or component
  content: z.string(),
  reason: z.string(),
});

export const agentDelegationSchema = z.object({
  to: z.enum(['manager', 'shepherd', 'advisor', 'architect', 'editor']),
  reason: z.string(),
  context: z.string(),
});

export const agentRequestSchema = z.object({
  appId: z.string().min(1, "App ID is required"),
  workspaceId: z.string().min(1, "Workspace ID is required"),
  userMessage: z.string().min(1, "User message is required"),
  fileContents: z.record(z.string(), z.string()),
  conversationHistory: z.array(agentChatMessageSchema).default([]),
});

export const agentResponseSchema = z.object({
  content: z.string(),
  actions: z.array(agentActionSchema).optional(),
  shouldDelegate: agentDelegationSchema.optional(),
  completed: z.boolean(),
});

export type AgentChatMessage = z.infer<typeof agentChatMessageSchema>;
export type AgentAction = z.infer<typeof agentActionSchema>;
export type AgentDelegation = z.infer<typeof agentDelegationSchema>;
export type AgentRequest = z.infer<typeof agentRequestSchema>;
export type AgentResponse = z.infer<typeof agentResponseSchema>;

// Git operations schemas
export interface GitCommit {
  sha: string;
  message: string;
  author: {
    name: string;
    email: string;
  };
  date: Date;
  files: string[]; // list of changed files
}
