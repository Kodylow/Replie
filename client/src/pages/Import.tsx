import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useLocation } from 'wouter'
import { Upload, Github, Copy, CheckCircle, AlertCircle, Loader2, GitBranch, FolderOpen, Search, Filter, Star, Clock, Tag, Gamepad2, Bot, BarChart3, Terminal, Globe, Server, Zap, Brain, MessageSquare, Joystick } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { githubImportSchema, type GitHubImportRequest, zipImportSchema, type ZipImportRequest, templateCloneSchema, type TemplateCloneRequest, type Template } from '@shared/schema'
import { apiRequest } from '@/lib/queryClient'

export default function Import() {
  const [, setLocation] = useLocation()
  const { toast } = useToast()
  const { workspaces, currentWorkspace } = useWorkspace()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  
  // Template-related state
  const [templateSearch, setTemplateSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [showCloneForm, setShowCloneForm] = useState(false)

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

  // ZIP Import Form
  const zipForm = useForm<ZipImportRequest>({
    resolver: zodResolver(zipImportSchema),
    defaultValues: {
      workspaceId: currentWorkspace?.id || '',
      category: 'web',
      isPrivate: true,
    },
  })

  // Template Clone Form
  const cloneForm = useForm<TemplateCloneRequest>({
    resolver: zodResolver(templateCloneSchema),
    defaultValues: {
      templateId: '',
      workspaceId: currentWorkspace?.id || '',
      projectName: '',
      projectDescription: '',
      isPrivate: true,
    },
  })

  // Template queries
  const templatesQuery = useQuery({
    queryKey: ['/api/templates', { category: selectedCategory, search: templateSearch }],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (selectedCategory && selectedCategory !== 'all') params.set('category', selectedCategory)
      if (templateSearch) params.set('search', templateSearch)
      
      const response = await fetch(`/api/templates?${params.toString()}`, {
        credentials: 'include',
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch templates')
      }
      
      return response.json() as Promise<Template[]>
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

  // ZIP Import Mutation
  const zipImportMutation = useMutation({
    mutationFn: async (data: ZipImportRequest & { file: File }) => {
      const formData = new FormData()
      formData.append('zipFile', data.file)
      formData.append('workspaceId', data.workspaceId)
      formData.append('projectName', data.projectName)
      if (data.projectDescription) {
        formData.append('projectDescription', data.projectDescription)
      }
      formData.append('category', data.category)
      formData.append('isPrivate', data.isPrivate.toString())

      const response = await fetch('/api/import/zip', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Upload failed')
      }

      return response.json()
    },
    onSuccess: (data: any) => {
      toast({
        title: 'ZIP file imported successfully!',
        description: `${data.title} has been imported to your workspace.`,
      })
      setSelectedFile(null)
      setUploadProgress(0)
      zipForm.reset()
      setLocation(`/project/${data.id}`)
    },
    onError: (error: any) => {
      toast({
        title: 'Import failed',
        description: error.message || 'Failed to import ZIP file. Please try again.',
        variant: 'destructive',
      })
      setUploadProgress(0)
    },
  })

  // Template Clone Mutation
  const templateCloneMutation = useMutation({
    mutationFn: async (data: TemplateCloneRequest) => {
      const response = await apiRequest('POST', '/api/import/clone', data)
      return response.json()
    },
    onSuccess: (data: any) => {
      toast({
        title: 'Template cloned successfully!',
        description: `${data.title} has been created from the template.`,
      })
      setSelectedTemplate(null)
      setShowCloneForm(false)
      cloneForm.reset()
      setLocation(`/project/${data.id}`)
    },
    onError: (error: any) => {
      toast({
        title: 'Clone failed',
        description: error.message || 'Failed to clone template. Please try again.',
        variant: 'destructive',
      })
    },
  })

  const handleGitHubImport = (data: GitHubImportRequest) => {
    githubImportMutation.mutate(data)
  }

  const handleZipImport = (data: ZipImportRequest) => {
    if (!selectedFile) {
      toast({
        title: 'No file selected',
        description: 'Please select a ZIP file to upload.',
        variant: 'destructive',
      })
      return
    }

    zipImportMutation.mutate({ ...data, file: selectedFile })
  }

  const handleTemplateClone = (data: TemplateCloneRequest) => {
    templateCloneMutation.mutate(data)
  }

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template)
    cloneForm.setValue('templateId', template.id)
    cloneForm.setValue('projectName', template.title)
    cloneForm.setValue('projectDescription', template.description)
    setShowCloneForm(true)
  }

  const getTemplateIcon = (iconName: string | null) => {
    const iconMap: Record<string, any> = {
      Globe, Server, Zap, BarChart3, Brain, Gamepad2, Joystick, Bot, MessageSquare, Terminal
    }
    const IconComponent = iconName && iconMap[iconName] ? iconMap[iconName] : Globe
    return IconComponent
  }

  const getCategoryIcon = (category: string) => {
    const categoryIcons: Record<string, any> = {
      web: Globe,
      data: BarChart3,
      game: Gamepad2,
      agents: Bot,
      general: Terminal
    }
    return categoryIcons[category] || Globe
  }

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'web', label: 'Web Development' },
    { value: 'data', label: 'Data Science' },
    { value: 'game', label: 'Game Development' },
    { value: 'agents', label: 'AI Agents' },
    { value: 'general', label: 'General Programming' },
  ]

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
      
      // Validate file type
      if (!file.type.includes('zip') && !file.name.toLowerCase().endsWith('.zip')) {
        toast({
          title: 'Invalid file type',
          description: 'Please select a ZIP file.',
          variant: 'destructive',
        })
        return
      }

      // Validate file size (50MB limit)
      const maxSize = 50 * 1024 * 1024 // 50MB
      if (file.size > maxSize) {
        toast({
          title: 'File too large',
          description: 'ZIP file must be smaller than 50MB.',
          variant: 'destructive',
        })
        return
      }

      setSelectedFile(file)
      
      // Auto-populate project name from file name if not already set
      if (!zipForm.getValues('projectName')) {
        const fileName = file.name.replace(/\.zip$/i, '')
        zipForm.setValue('projectName', fileName)
      }
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      
      // Validate file type
      if (!file.type.includes('zip') && !file.name.toLowerCase().endsWith('.zip')) {
        toast({
          title: 'Invalid file type',
          description: 'Please select a ZIP file.',
          variant: 'destructive',
        })
        return
      }

      // Validate file size (50MB limit)
      const maxSize = 50 * 1024 * 1024 // 50MB
      if (file.size > maxSize) {
        toast({
          title: 'File too large',
          description: 'ZIP file must be smaller than 50MB.',
          variant: 'destructive',
        })
        return
      }

      setSelectedFile(file)
      
      // Auto-populate project name from file name if not already set
      if (!zipForm.getValues('projectName')) {
        const fileName = file.name.replace(/\.zip$/i, '')
        zipForm.setValue('projectName', fileName)
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
              {/* File Upload Area */}
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedFile(null)}
                      className="text-xs"
                      data-testid="button-remove-file"
                    >
                      Remove file
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">
                      Drag and drop your ZIP file here, or click to browse
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Maximum file size: 50MB
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

              {/* ZIP Import Form */}
              {selectedFile && (
                <div className="mt-6">
                  <Separator className="mb-6" />
                  <Form {...zipForm}>
                    <form onSubmit={zipForm.handleSubmit(handleZipImport)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={zipForm.control}
                          name="projectName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Project Name</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="My Awesome Project"
                                  {...field}
                                  data-testid="input-zip-project-name"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={zipForm.control}
                          name="workspaceId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                <FolderOpen className="w-4 h-4" />
                                Workspace
                              </FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-zip-workspace">
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
                          control={zipForm.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Category</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-zip-category">
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
                          control={zipForm.control}
                          name="isPrivate"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                              <div className="space-y-0.5">
                                <FormLabel className="text-sm font-medium">Private Project</FormLabel>
                                <FormDescription className="text-xs">
                                  Only you and your team can see this project
                                </FormDescription>
                              </div>
                              <FormControl>
                                <input
                                  type="checkbox"
                                  checked={field.value}
                                  onChange={field.onChange}
                                  className="rounded"
                                  data-testid="checkbox-zip-private"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={zipForm.control}
                          name="projectDescription"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Description (Optional)</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Describe your project..."
                                  className="min-h-[80px]"
                                  {...field}
                                  data-testid="input-zip-project-description"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={zipImportMutation.isPending}
                        className="w-full md:w-auto"
                        data-testid="button-upload-zip"
                      >
                        {zipImportMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Uploading and Importing...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Upload and Import
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Make a Clone - Template Browser */}
          <Card className="w-full" data-testid="card-clone-import">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-500/10 rounded-lg">
                <Copy className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <CardTitle className="text-xl">Make a Clone</CardTitle>
                <CardDescription>
                  Clone a professionally-crafted template to jumpstart your project
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Search and Filter Controls */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search templates..."
                      value={templateSearch}
                      onChange={(e) => setTemplateSearch(e.target.value)}
                      className="pl-9"
                      data-testid="input-template-search"
                    />
                  </div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full sm:w-48" data-testid="select-template-category">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Template Grid */}
                <div className="min-h-[300px]">
                  {templatesQuery.isLoading ? (
                    <div className="flex items-center justify-center h-48">
                      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                      <span className="ml-3 text-muted-foreground">Loading templates...</span>
                    </div>
                  ) : templatesQuery.error ? (
                    <div className="flex items-center justify-center h-48 text-center">
                      <div>
                        <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
                        <p className="text-muted-foreground">Failed to load templates</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => templatesQuery.refetch()}
                          className="mt-2"
                        >
                          Try Again
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {templatesQuery.data?.map((template) => {
                        const IconComponent = getTemplateIcon(template.iconName)
                        const CategoryIcon = getCategoryIcon(template.category)
                        
                        return (
                          <div
                            key={template.id}
                            className="border rounded-lg p-4 hover-elevate cursor-pointer transition-all duration-200 group"
                            onClick={() => handleTemplateSelect(template)}
                            data-testid={`card-template-${template.title.toLowerCase().replace(/\s+/g, '-')}`}
                          >
                            <div className="flex items-start gap-3 mb-3">
                              <div className={`p-2 rounded-lg ${template.backgroundColor.includes('gradient') ? template.backgroundColor : 'bg-primary/10'}`}>
                                <IconComponent className="w-5 h-5 text-primary-foreground" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h5 className="font-semibold text-sm truncate">{template.title}</h5>
                                  {template.isOfficial === 'true' && (
                                    <CheckCircle className="w-3 h-3 text-blue-500 flex-shrink-0" />
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                                  <CategoryIcon className="w-3 h-3" />
                                  <span className="capitalize">{template.category}</span>
                                  <span>•</span>
                                  <span className="capitalize">{template.difficulty}</span>
                                  {template.estimatedTime && (
                                    <>
                                      <span>•</span>
                                      <Clock className="w-3 h-3" />
                                      <span>{template.estimatedTime}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                              {template.description}
                            </p>
                            
                            {/* Tags */}
                            <div className="flex flex-wrap gap-1 mb-3">
                              {template.tags.slice(0, 3).map((tag, index) => (
                                <div
                                  key={index}
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded-md text-xs text-muted-foreground"
                                >
                                  <Tag className="w-2.5 h-2.5" />
                                  {tag}
                                </div>
                              ))}
                              {template.tags.length > 3 && (
                                <span className="px-2 py-1 text-xs text-muted-foreground">
                                  +{template.tags.length - 3} more
                                </span>
                              )}
                            </div>
                            
                            {/* Footer */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Star className="w-3 h-3" />
                                <span>{template.usageCount} clones</span>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                data-testid={`button-clone-${template.title.toLowerCase().replace(/\s+/g, '-')}`}
                              >
                                <Copy className="w-3 h-3 mr-1" />
                                Clone
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                  
                  {templatesQuery.data && templatesQuery.data.length === 0 && (
                    <div className="flex items-center justify-center h-48 text-center">
                      <div>
                        <Search className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground">No templates found</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Try adjusting your search or category filter
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Template Clone Form Dialog */}
          <Dialog open={showCloneForm} onOpenChange={setShowCloneForm}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  {selectedTemplate && (
                    <>
                      <div className={`p-2 rounded-lg ${selectedTemplate.backgroundColor}`}>
                        {(() => {
                          const IconComponent = getTemplateIcon(selectedTemplate.iconName)
                          return <IconComponent className="w-5 h-5 text-primary-foreground" />
                        })()}
                      </div>
                      <div>
                        <div>Clone Template</div>
                        <div className="text-sm font-normal text-muted-foreground">
                          {selectedTemplate.title}
                        </div>
                      </div>
                    </>
                  )}
                </DialogTitle>
                <DialogDescription>
                  Customize your new project based on this template
                </DialogDescription>
              </DialogHeader>

              <Form {...cloneForm}>
                <form onSubmit={cloneForm.handleSubmit(handleTemplateClone)} className="space-y-4">
                  <FormField
                    control={cloneForm.control}
                    name="workspaceId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <FolderOpen className="w-4 h-4" />
                          Workspace
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-clone-workspace">
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
                    control={cloneForm.control}
                    name="projectName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="My Awesome Project"
                            {...field}
                            data-testid="input-clone-project-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={cloneForm.control}
                    name="projectDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe your project..."
                            className="min-h-[80px]"
                            {...field}
                            data-testid="input-clone-project-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-between pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowCloneForm(false)
                        setSelectedTemplate(null)
                      }}
                      data-testid="button-cancel-clone"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={templateCloneMutation.isPending}
                      data-testid="button-confirm-clone"
                    >
                      {templateCloneMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Cloning...
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Clone Template
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}