import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useLocation } from 'wouter'
import { Upload, Github, Copy, CheckCircle, AlertCircle, Loader2, GitBranch, FolderOpen } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { githubImportSchema, type GitHubImportRequest } from '@shared/schema'
import { apiRequest } from '@/lib/queryClient'

export default function Import() {
  const [, setLocation] = useLocation()
  const { toast } = useToast()
  const { workspaces, currentWorkspace } = useWorkspace()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)

  // GitHub Import Form
  const githubForm = useForm<GitHubImportRequest>({
    resolver: zodResolver(githubImportSchema),
    defaultValues: {
      branch: 'main',
      workspaceId: currentWorkspace?.id || '',
      category: 'web',
      isPrivate: true,
    },
  })

  // GitHub Import Mutation
  const githubImportMutation = useMutation({
    mutationFn: async (data: GitHubImportRequest) => {
      const response = await apiRequest('POST', '/api/import/github', data)
      return response.json()
    },
    onSuccess: (data: any) => {
      toast({
        title: 'Repository imported successfully!',
        description: `${data.title} has been imported to your workspace.`,
      })
      setLocation(`/project/${data.id}`)
    },
    onError: (error: any) => {
      toast({
        title: 'Import failed',
        description: error.message || 'Failed to import repository. Please try again.',
        variant: 'destructive',
      })
    },
  })

  const handleGitHubImport = (data: GitHubImportRequest) => {
    githubImportMutation.mutate(data)
  }

  // File upload handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (file.type === 'application/zip' || file.name.endsWith('.zip')) {
        setSelectedFile(file)
      } else {
        toast({
          title: 'Invalid file type',
          description: 'Please select a ZIP file.',
          variant: 'destructive',
        })
      }
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.type === 'application/zip' || file.name.endsWith('.zip')) {
        setSelectedFile(file)
      } else {
        toast({
          title: 'Invalid file type',
          description: 'Please select a ZIP file.',
          variant: 'destructive',
        })
      }
    }
  }

  return (
    <div className="h-full overflow-auto bg-background">
      <div className="container mx-auto py-8 px-6 max-w-4xl">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-page-title">
            Import to Replit
          </h1>
          <p className="text-lg text-muted-foreground" data-testid="text-page-subtitle">
            Bring your existing projects to Replit and start coding immediately
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
          {/* GitHub Repository Import */}
          <Card className="w-full" data-testid="card-github-import">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
                <Github className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Import from GitHub</CardTitle>
                <CardDescription>
                  Import a repository directly from GitHub with full history and branches
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Form {...githubForm}>
                <form onSubmit={githubForm.handleSubmit(handleGitHubImport)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={githubForm.control}
                      name="repositoryUrl"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Repository URL</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://github.com/username/repository"
                              {...field}
                              data-testid="input-repository-url"
                            />
                          </FormControl>
                          <FormDescription>
                            Enter the full GitHub repository URL you want to import
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={githubForm.control}
                      name="branch"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <GitBranch className="w-4 h-4" />
                            Branch
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="main"
                              {...field}
                              data-testid="input-branch"
                            />
                          </FormControl>
                          <FormDescription>
                            Branch to import (defaults to main)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={githubForm.control}
                      name="workspaceId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <FolderOpen className="w-4 h-4" />
                            Workspace
                          </FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-workspace">
                                <SelectValue placeholder="Select workspace" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {workspaces.map((workspace) => (
                                <SelectItem key={workspace.id} value={workspace.id}>
                                  {workspace.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={githubForm.control}
                      name="projectName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="My Awesome Project"
                              {...field}
                              data-testid="input-project-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={githubForm.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-category">
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="web">Web Development</SelectItem>
                              <SelectItem value="data">Data Science</SelectItem>
                              <SelectItem value="game">Game Development</SelectItem>
                              <SelectItem value="general">General Programming</SelectItem>
                              <SelectItem value="agents">AI Agents</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={githubForm.control}
                      name="projectDescription"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe your project..."
                              className="min-h-[80px]"
                              {...field}
                              data-testid="input-project-description"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={githubImportMutation.isPending}
                    className="w-full md:w-auto"
                    data-testid="button-import-repository"
                  >
                    {githubImportMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Importing Repository...
                      </>
                    ) : (
                      <>
                        <Github className="w-4 h-4 mr-2" />
                        Import Repository
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Import from Zip */}
          <Card className="w-full" data-testid="card-zip-import">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 bg-orange-500/10 rounded-lg">
                <Upload className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <CardTitle className="text-xl">Import from ZIP File</CardTitle>
                <CardDescription>
                  Upload a ZIP file containing your project code and files
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? 'border-primary bg-primary/5'
                    : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                data-testid="dropzone-zip-upload"
              >
                <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                {selectedFile ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground flex items-center justify-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">
                      Drag and drop your ZIP file here, or click to browse
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Maximum file size: 100MB
                    </p>
                  </div>
                )}
                <input
                  type="file"
                  accept=".zip"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="zip-file-input"
                />
                <Label htmlFor="zip-file-input">
                  <Button
                    variant="outline"
                    className="mt-4"
                    type="button"
                    data-testid="button-browse-zip"
                  >
                    Browse Files
                  </Button>
                </Label>
              </div>

              {selectedFile && (
                <div className="mt-6 space-y-4">
                  <Separator />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="zip-project-name">Project Name</Label>
                      <Input
                        id="zip-project-name"
                        placeholder="My Project"
                        className="mt-2"
                        data-testid="input-zip-project-name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="zip-workspace">Workspace</Label>
                      <Select>
                        <SelectTrigger className="mt-2" data-testid="select-zip-workspace">
                          <SelectValue placeholder="Select workspace" />
                        </SelectTrigger>
                        <SelectContent>
                          {workspaces.map((workspace) => (
                            <SelectItem key={workspace.id} value={workspace.id}>
                              {workspace.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button className="w-full md:w-auto" data-testid="button-upload-zip">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload and Import
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Make a Clone */}
          <Card className="w-full" data-testid="card-clone-import">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-500/10 rounded-lg">
                <Copy className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <CardTitle className="text-xl">Make a Clone</CardTitle>
                <CardDescription>
                  Clone an existing public Replit project as a starting point
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="clone-search">Search Projects</Label>
                  <Input
                    id="clone-search"
                    placeholder="Search for projects to clone..."
                    className="mt-2"
                    data-testid="input-clone-search"
                  />
                </div>
                
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Popular Templates</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { name: 'React Starter', author: 'replit', description: 'A modern React application template' },
                      { name: 'Node.js API', author: 'replit', description: 'Express.js REST API boilerplate' },
                      { name: 'Python Flask', author: 'replit', description: 'Flask web application starter' },
                      { name: 'Next.js Blog', author: 'replit', description: 'Full-stack blog with Next.js' },
                    ].map((template, index) => (
                      <div
                        key={index}
                        className="border rounded-lg p-3 hover-elevate cursor-pointer"
                        data-testid={`card-template-${template.name.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h5 className="font-medium text-sm">{template.name}</h5>
                            <p className="text-xs text-muted-foreground">by {template.author}</p>
                            <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
                          </div>
                          <Button size="sm" variant="ghost" data-testid={`button-clone-${template.name.toLowerCase().replace(/\s+/g, '-')}`}>
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}