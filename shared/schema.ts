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
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
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

export const insertWorkspaceSchema = createInsertSchema(workspaces).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWorkspaceMemberSchema = createInsertSchema(workspaceMembers).omit({
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
export type InsertWorkspace = z.infer<typeof insertWorkspaceSchema>;
export type Workspace = typeof workspaces.$inferSelect;
export type InsertWorkspaceMember = z.infer<typeof insertWorkspaceMemberSchema>;
export type WorkspaceMember = typeof workspaceMembers.$inferSelect;

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
