import { useState } from 'react'
import { Search, ExternalLink, Database, Archive, Shield, Globe, Github, FileText, Box, Zap, Mail, Calendar, Building, Music } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useWorkspace } from '@/contexts/WorkspaceContext'

interface ReplitManagedIntegration {
  id: string
  name: string
  type: string
  icon: any
  description: string
}

interface Connector {
  id: string
  name: string
  description: string
  icon: any
  status: 'active' | 'inactive'
  isPersonalOnly?: boolean
  isTeamOnly?: boolean
}

interface MCPServer {
  id: string
  name: string
  description: string
  icon: any
  status: 'active' | 'inactive'
}

const REPLIT_MANAGED_INTEGRATIONS: ReplitManagedIntegration[] = [
  {
    id: 'replit-database',
    name: 'Replit Database',
    type: 'PostgreSQL',
    icon: Database,
    description: 'Built-in PostgreSQL database that works automatically'
  },
  {
    id: 'replit-storage',
    name: 'Replit App Storage',
    type: 'Object Storage',
    icon: Archive,
    description: 'Object storage for your app files and assets'
  },
  {
    id: 'replit-auth',
    name: 'Replit Auth',
    type: 'Authentication',
    icon: Shield,
    description: 'User authentication and session management'
  },
  {
    id: 'replit-domains',
    name: 'Replit Domains',
    type: 'Domains',
    icon: Globe,
    description: 'Custom domain management for your apps'
  }
]

const PERSONAL_CONNECTORS: Connector[] = [
  {
    id: 'github',
    name: 'GitHub',
    description: 'Access GitHub repositories, users, and organizations from your apps.',
    icon: Github,
    status: 'active'
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Read and write to your Notion workspace and pages.',
    icon: FileText,
    status: 'active'
  },
  {
    id: 'dropbox',
    name: 'Dropbox',
    description: 'Read Dropbox files, content, and metadata from your apps.',
    icon: Box,
    status: 'inactive'
  },
  {
    id: 'linear',
    name: 'Linear',
    description: 'Create and manage Linear issues, comments, and schedules.',
    icon: Zap,
    status: 'inactive'
  }
]

const TEAM_CONNECTORS: Connector[] = [
  ...PERSONAL_CONNECTORS,
  {
    id: 'outlook',
    name: 'Outlook',
    description: 'Send, receive emails and manage Outlook calendar events.',
    icon: Mail,
    status: 'inactive',
    isTeamOnly: true
  },
  {
    id: 'sharepoint',
    name: 'SharePoint',
    description: 'Read, write, and manage SharePoint sites and documents.',
    icon: Building,
    status: 'inactive',
    isTeamOnly: true
  },
  {
    id: 'spotify',
    name: 'Spotify',
    description: 'Access and manage Spotify playlists and library from your apps.',
    icon: Music,
    status: 'inactive'
  }
]

const MCP_SERVERS: MCPServer[] = [
  {
    id: 'figma-mcp',
    name: 'Figma MCP',
    description: 'Allow Replit Agent to view and build designs from Figma.',
    icon: Box,
    status: 'inactive'
  }
]

function ReplitManagedSection({ integrations, searchQuery }: { integrations: ReplitManagedIntegration[], searchQuery: string }) {
  const filteredIntegrations = integrations.filter(integration =>
    integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    integration.type.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <section>
      <h2 className="text-lg font-semibold mb-2" data-testid="text-replit-managed-title">
        Replit managed
      </h2>
      <p className="text-sm text-muted-foreground mb-4">
        These are built-in integrations that work automatically. Create an app and your agent can start using these right away.
      </p>
      
      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Name</th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Type</th>
              <th className="text-right p-4 text-sm font-medium text-muted-foreground"></th>
            </tr>
          </thead>
          <tbody>
            {filteredIntegrations.map((integration, index) => {
              const IconComponent = integration.icon
              return (
                <tr key={integration.id} className={index !== filteredIntegrations.length - 1 ? "border-b border-border" : ""}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <span className="font-medium text-sm" data-testid={`text-integration-name-${integration.id}`}>
                        {integration.name}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-sm text-muted-foreground" data-testid={`text-integration-type-${integration.id}`}>
                      {integration.type}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-2"
                      data-testid={`button-learn-more-${integration.id}`}
                    >
                      <ExternalLink className="w-3 h-3" />
                      Learn more
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function ConnectorsSection({ connectors, searchQuery }: { connectors: Connector[], searchQuery: string }) {
  const filteredConnectors = connectors.filter(connector =>
    connector.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    connector.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold mb-1" data-testid="text-connectors-title">
            Connectors
          </h2>
          <p className="text-sm text-muted-foreground">
            These are first-party integrations Replit supports. Sign in once and build with them across your apps.
          </p>
        </div>
        <Button variant="outline" size="sm" data-testid="button-all-connectors">
          All connectors
        </Button>
      </div>
      
      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Name</th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Description</th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Connection Status</th>
              <th className="text-right p-4 text-sm font-medium text-muted-foreground"></th>
            </tr>
          </thead>
          <tbody>
            {filteredConnectors.map((connector, index) => {
              const IconComponent = connector.icon
              return (
                <tr key={connector.id} className={index !== filteredConnectors.length - 1 ? "border-b border-border" : ""}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <span className="font-medium text-sm" data-testid={`text-connector-name-${connector.id}`}>
                        {connector.name}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-sm text-muted-foreground" data-testid={`text-connector-description-${connector.id}`}>
                      {connector.description}
                    </span>
                  </td>
                  <td className="p-4">
                    {connector.status === 'active' ? (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-green-700" data-testid={`text-connector-status-${connector.id}`}>
                          Active
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground" data-testid={`text-connector-status-${connector.id}`}>
                        Not connected
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    {connector.status === 'active' ? (
                      <Button 
                        variant="outline" 
                        size="sm"
                        data-testid={`button-manage-${connector.id}`}
                      >
                        Manage
                      </Button>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-2"
                        data-testid={`button-sign-in-${connector.id}`}
                      >
                        Sign in
                      </Button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function MCPServersSection({ servers, searchQuery }: { servers: MCPServer[], searchQuery: string }) {
  const filteredServers = servers.filter(server =>
    server.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    server.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <section>
      <div className="flex items-center gap-2 mb-2">
        <h2 className="text-lg font-semibold" data-testid="text-mcp-servers-title">
          MCP Servers for Replit Agent
        </h2>
        <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
          Beta
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Provide external context and tools to Replit Agent by connecting to{' '}
        <a href="#" className="text-blue-600 hover:underline">external MCP servers</a>.
      </p>
      
      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Name</th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Description</th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Connection Status</th>
              <th className="text-right p-4 text-sm font-medium text-muted-foreground"></th>
            </tr>
          </thead>
          <tbody>
            {filteredServers.map((server, index) => {
              const IconComponent = server.icon
              return (
                <tr key={server.id} className={index !== filteredServers.length - 1 ? "border-b border-border" : ""}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <span className="font-medium text-sm" data-testid={`text-mcp-server-name-${server.id}`}>
                        {server.name}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-sm text-muted-foreground" data-testid={`text-mcp-server-description-${server.id}`}>
                      {server.description}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="text-sm text-muted-foreground" data-testid={`text-mcp-server-status-${server.id}`}>
                      Not connected
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-2"
                      data-testid={`button-sign-in-mcp-${server.id}`}
                    >
                      Sign in
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default function Integrations() {
  const [searchQuery, setSearchQuery] = useState('')
  const { currentWorkspace } = useWorkspace()
  
  const isTeamWorkspace = currentWorkspace?.type === 'team'
  const connectors = isTeamWorkspace ? TEAM_CONNECTORS : PERSONAL_CONNECTORS

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b bg-background">
        <div>
          <h1 className="text-xl font-semibold" data-testid="text-integrations-title">
            Integrations
          </h1>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search integrations"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-64"
              data-testid="input-search-integrations"
            />
          </div>
          
          <Button variant="outline" className="gap-2" data-testid="button-request-integration">
            <ExternalLink className="w-4 h-4" />
            Request an integration
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          <ReplitManagedSection 
            integrations={REPLIT_MANAGED_INTEGRATIONS} 
            searchQuery={searchQuery} 
          />
          
          <ConnectorsSection 
            connectors={connectors} 
            searchQuery={searchQuery} 
          />
          
          <MCPServersSection 
            servers={MCP_SERVERS} 
            searchQuery={searchQuery} 
          />

          {/* No Results */}
          {searchQuery && (
            (() => {
              const hasResults = REPLIT_MANAGED_INTEGRATIONS.some(integration =>
                integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                integration.type.toLowerCase().includes(searchQuery.toLowerCase())
              ) || connectors.some(connector =>
                connector.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                connector.description.toLowerCase().includes(searchQuery.toLowerCase())
              ) || MCP_SERVERS.some(server =>
                server.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                server.description.toLowerCase().includes(searchQuery.toLowerCase())
              )
              
              if (!hasResults) {
                return (
                  <div className="text-center py-12">
                    <Search className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-muted-foreground">No integrations found matching "{searchQuery}"</p>
                  </div>
                )
              }
              return null
            })()
          )}
        </div>
      </div>
    </div>
  )
}