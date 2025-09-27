import simpleGit, { SimpleGit } from 'simple-git';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { randomUUID } from 'crypto';
import { objectStorageClient } from './objectStorage.js';
import type { GitCommit } from '../shared/schema.js';

export class GitServiceError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'GitServiceError';
    Object.setPrototypeOf(this, GitServiceError.prototype);
  }
}

function parseObjectPath(path: string): { bucketName: string; objectName: string } {
  if (!path.startsWith("/")) {
    path = `/${path}`;
  }
  const pathParts = path.split("/");
  if (pathParts.length < 3) {
    throw new Error("Invalid path: must contain at least a bucket name");
  }

  const bucketName = pathParts[1];
  const objectName = pathParts.slice(2).join("/");

  return { bucketName, objectName };
}

export class GitService {
  constructor() {}

  /**
   * Creates a new Git repository and returns the initial commit SHA
   */
  async initializeRepository(
    appId: string,
    objectStoragePath: string,
    initialAuthor: { name: string; email: string }
  ): Promise<string> {
    const tempDir = await this.createTempDirectory();
    
    try {
      // Initialize git repository
      const git = simpleGit(tempDir);
      await git.init();
      
      // Configure user for this repository
      await git.addConfig('user.name', initialAuthor.name);
      await git.addConfig('user.email', initialAuthor.email);
      
      // Create initial files
      const readmePath = path.join(tempDir, 'README.md');
      const gitignorePath = path.join(tempDir, '.gitignore');
      
      await fs.writeFile(readmePath, `# ${appId}\n\nThis project was created in Replit.\n`);
      await fs.writeFile(gitignorePath, `node_modules/\n.env\n*.log\n.DS_Store\n`);
      
      // Add and commit initial files
      await git.add(['.']);
      const commitResult = await git.commit('Initial commit', undefined, {
        '--author': `${initialAuthor.name} <${initialAuthor.email}>`
      });
      
      // Sync .git directory to object storage
      await this.syncGitToObjectStorage(tempDir, appId, objectStoragePath);
      
      return commitResult.commit;
    } catch (error) {
      throw new GitServiceError(`Failed to initialize repository: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error : undefined);
    } finally {
      await this.cleanupTempDirectory(tempDir);
    }
  }

  /**
   * Commits file changes and returns the commit SHA
   */
  async commitChanges(
    appId: string,
    objectStoragePath: string,
    files: Record<string, string>,
    author: { name: string; email: string },
    message: string
  ): Promise<string> {
    const tempDir = await this.createTempDirectory();
    
    try {
      // Restore .git directory from object storage
      await this.syncGitFromObjectStorage(tempDir, appId, objectStoragePath);
      
      const git = simpleGit(tempDir);
      
      // Configure user for this commit
      await git.addConfig('user.name', author.name);
      await git.addConfig('user.email', author.email);
      
      // Write files to temporary directory
      for (const [filename, content] of Object.entries(files)) {
        const filePath = path.join(tempDir, filename);
        const fileDir = path.dirname(filePath);
        
        // Ensure directory exists
        await fs.mkdir(fileDir, { recursive: true });
        await fs.writeFile(filePath, content);
      }
      
      // Add changed files to git
      await git.add(Object.keys(files));
      
      // Check if there are any changes to commit
      const status = await git.status();
      if (status.files.length === 0) {
        throw new GitServiceError('No changes to commit');
      }
      
      // Commit changes
      const commitResult = await git.commit(message, undefined, {
        '--author': `${author.name} <${author.email}>`
      });
      
      // Sync .git directory back to object storage
      await this.syncGitToObjectStorage(tempDir, appId, objectStoragePath);
      
      return commitResult.commit;
    } catch (error) {
      throw new GitServiceError(`Failed to commit changes: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error : undefined);
    } finally {
      await this.cleanupTempDirectory(tempDir);
    }
  }

  /**
   * Gets the commit history for the repository
   */
  async getCommitHistory(
    appId: string,
    objectStoragePath: string,
    limit?: number
  ): Promise<GitCommit[]> {
    const tempDir = await this.createTempDirectory();
    
    try {
      // Restore .git directory from object storage
      await this.syncGitFromObjectStorage(tempDir, appId, objectStoragePath);
      
      const git = simpleGit(tempDir);
      
      // Get commit log
      const log = await git.log({
        maxCount: limit || 50,
        format: {
          hash: '%H',
          date: '%ai',
          message: '%s',
          author_name: '%an',
          author_email: '%ae',
        }
      });
      
      // Get files changed for each commit
      const commits: GitCommit[] = [];
      
      for (const commit of log.all) {
        try {
          // Get files changed in this commit
          const diffSummary = await git.diffSummary([`${commit.hash}~1`, commit.hash]);
          const changedFiles = diffSummary.files.map(file => file.file);
          
          commits.push({
            sha: commit.hash,
            message: commit.message,
            author: {
              name: commit.author_name,
              email: commit.author_email,
            },
            date: new Date(commit.date),
            files: changedFiles,
          });
        } catch (diffError) {
          // For the initial commit, there's no previous commit to diff against
          // Get all files in the repository at this commit
          const files = await git.raw(['ls-tree', '--name-only', '-r', commit.hash]);
          const fileList = files.trim().split('\n').filter(f => f.length > 0);
          
          commits.push({
            sha: commit.hash,
            message: commit.message,
            author: {
              name: commit.author_name,
              email: commit.author_email,
            },
            date: new Date(commit.date),
            files: fileList,
          });
        }
      }
      
      return commits;
    } catch (error) {
      throw new GitServiceError(`Failed to get commit history: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error : undefined);
    } finally {
      await this.cleanupTempDirectory(tempDir);
    }
  }

  /**
   * Gets information about the current branch
   */
  async getBranchInfo(
    appId: string,
    objectStoragePath: string
  ): Promise<{ currentBranch: string; lastCommit?: GitCommit }> {
    const tempDir = await this.createTempDirectory();
    
    try {
      // Restore .git directory from object storage
      await this.syncGitFromObjectStorage(tempDir, appId, objectStoragePath);
      
      const git = simpleGit(tempDir);
      
      // Get current branch
      const currentBranch = await git.revparse(['--abbrev-ref', 'HEAD']);
      
      // Get last commit
      let lastCommit: GitCommit | undefined;
      
      try {
        const log = await git.log({ maxCount: 1 });
        if (log.latest) {
          const commit = log.latest;
          
          // Get files changed in the last commit
          let changedFiles: string[] = [];
          try {
            const diffSummary = await git.diffSummary([`${commit.hash}~1`, commit.hash]);
            changedFiles = diffSummary.files.map(file => file.file);
          } catch {
            // For initial commit, get all files
            const files = await git.raw(['ls-tree', '--name-only', '-r', commit.hash]);
            changedFiles = files.trim().split('\n').filter(f => f.length > 0);
          }
          
          lastCommit = {
            sha: commit.hash,
            message: commit.message,
            author: {
              name: commit.author_name,
              email: commit.author_email,
            },
            date: new Date(commit.date),
            files: changedFiles,
          };
        }
      } catch (commitError) {
        // Repository might be empty
        lastCommit = undefined;
      }
      
      return {
        currentBranch: currentBranch.trim(),
        lastCommit,
      };
    } catch (error) {
      throw new GitServiceError(`Failed to get branch info: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error : undefined);
    } finally {
      await this.cleanupTempDirectory(tempDir);
    }
  }

  /**
   * Creates a temporary directory for Git operations
   */
  private async createTempDirectory(): Promise<string> {
    const tempDir = path.join(os.tmpdir(), `git-${randomUUID()}`);
    await fs.mkdir(tempDir, { recursive: true });
    return tempDir;
  }

  /**
   * Cleans up a temporary directory
   */
  private async cleanupTempDirectory(tempDir: string): Promise<void> {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      console.warn(`Failed to cleanup temp directory ${tempDir}:`, error);
    }
  }

  /**
   * Syncs the .git directory from the local temp directory to object storage
   */
  private async syncGitToObjectStorage(
    tempDir: string,
    appId: string,
    objectStoragePath: string
  ): Promise<void> {
    const gitDir = path.join(tempDir, '.git');
    
    // Check if .git directory exists
    try {
      await fs.access(gitDir);
    } catch {
      throw new GitServiceError('.git directory not found in temp directory');
    }
    
    // Parse object storage path
    const { bucketName, objectName: basePath } = parseObjectPath(objectStoragePath);
    const bucket = objectStorageClient.bucket(bucketName);
    
    // Upload .git directory contents recursively
    await this.uploadDirectoryRecursively(gitDir, bucket, `${basePath}/.git`);
  }

  /**
   * Syncs the .git directory from object storage to the local temp directory
   */
  private async syncGitFromObjectStorage(
    tempDir: string,
    appId: string,
    objectStoragePath: string
  ): Promise<void> {
    const gitDir = path.join(tempDir, '.git');
    
    // Parse object storage path
    const { bucketName, objectName: basePath } = parseObjectPath(objectStoragePath);
    const bucket = objectStorageClient.bucket(bucketName);
    
    // Download .git directory contents recursively
    await this.downloadDirectoryRecursively(bucket, `${basePath}/.git`, gitDir);
  }

  /**
   * Uploads a directory and its contents recursively to object storage
   */
  private async uploadDirectoryRecursively(
    localDir: string,
    bucket: any,
    remotePath: string
  ): Promise<void> {
    try {
      const entries = await fs.readdir(localDir, { withFileTypes: true });
      
      for (const entry of entries) {
        const localPath = path.join(localDir, entry.name);
        const remoteFilePath = `${remotePath}/${entry.name}`;
        
        if (entry.isDirectory()) {
          // Recursively upload subdirectory
          await this.uploadDirectoryRecursively(localPath, bucket, remoteFilePath);
        } else if (entry.isFile()) {
          // Upload file
          const file = bucket.file(remoteFilePath);
          await file.save(await fs.readFile(localPath));
        }
      }
    } catch (error) {
      throw new GitServiceError(`Failed to upload directory ${localDir}: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error : undefined);
    }
  }

  /**
   * Downloads a directory and its contents recursively from object storage
   */
  private async downloadDirectoryRecursively(
    bucket: any,
    remotePath: string,
    localDir: string
  ): Promise<void> {
    try {
      // Ensure local directory exists
      await fs.mkdir(localDir, { recursive: true });
      
      // List all files with the remote path prefix
      const [files] = await bucket.getFiles({ prefix: remotePath });
      
      for (const file of files) {
        // Skip if it's just the directory marker
        if (file.name.endsWith('/')) continue;
        
        // Calculate relative path from the remote base path
        const relativePath = file.name.substring(remotePath.length + 1);
        if (!relativePath) continue;
        
        const localFilePath = path.join(localDir, relativePath);
        const localFileDir = path.dirname(localFilePath);
        
        // Ensure directory exists for this file
        await fs.mkdir(localFileDir, { recursive: true });
        
        // Download file
        const [contents] = await file.download();
        await fs.writeFile(localFilePath, contents);
      }
    } catch (error) {
      // If the .git directory doesn't exist in object storage, it might be a new repository
      if (error instanceof Error && error.message.includes('No such object')) {
        // This is fine - repository might not be initialized yet
        return;
      }
      throw new GitServiceError(`Failed to download directory ${remotePath}: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error : undefined);
    }
  }
}