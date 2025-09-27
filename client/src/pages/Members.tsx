import { useState } from 'react'
import { Search, Plus, Download, Users, MoreHorizontal, Trash2, UserCog } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useQuery } from '@tanstack/react-query'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import type { WorkspaceMemberWithUser } from '@shared/schema'

interface Member {
  id: string
  name: string
  username: string
  email: string
  role: string
  lastActive: string
  avatar?: string
}

// Transform WorkspaceMemberWithUser to Member interface
function transformMemberData(memberWithUser: WorkspaceMemberWithUser): Member {
  const { user, role } = memberWithUser
  const name = user.firstName && user.lastName 
    ? `${user.firstName} ${user.lastName}`
    : user.email || 'Unknown User'
  
  return {
    id: memberWithUser.id,
    name,
    username: `@${user.email?.split('@')[0] || 'user'}`,
    email: user.email || '',
    role: role.charAt(0).toUpperCase() + role.slice(1), // Capitalize role
    lastActive: '', // We don't have lastActive data from backend yet
    avatar: user.profileImageUrl || undefined
  }
}


interface MembersProps {
  searchResults: any[]
  isSearching: boolean
}

function MemberRow({ member }: { member: Member }) {
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'Admin':
        return 'default'
      case 'Member':
        return 'secondary'
      case 'Guest':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <tr className="border-b border-border hover-elevate">
      <td className="py-4 px-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={member.avatar} alt={member.name} />
            <AvatarFallback className="text-xs font-medium">
              {getInitials(member.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-medium text-sm truncate" data-testid={`text-member-name-${member.id}`}>
              {member.name}
            </p>
            <p className="text-xs text-muted-foreground truncate" data-testid={`text-member-username-${member.id}`}>
              {member.username}
            </p>
          </div>
        </div>
      </td>
      <td className="py-4 px-4">
        <span className="text-sm" data-testid={`text-member-email-${member.id}`}>
          {member.email}
        </span>
      </td>
      <td className="py-4 px-4">
        <Badge variant={getRoleBadgeVariant(member.role)} data-testid={`badge-member-role-${member.id}`}>
          {member.role}
        </Badge>
      </td>
      <td className="py-4 px-4">
        <span className="text-sm text-muted-foreground" data-testid={`text-member-last-active-${member.id}`}>
          {member.lastActive || '-'}
        </span>
      </td>
      <td className="py-4 px-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" data-testid={`button-member-actions-${member.id}`}>
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <UserCog className="w-4 h-4 mr-2" />
              Edit Role
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              Remove Member
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  )
}

export default function Members({ searchResults = [], isSearching }: MembersProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [activeTab, setActiveTab] = useState('members')
  const { currentWorkspace } = useWorkspace()

  // Fetch workspace members
  const { data: membersWithUsers = [], isLoading } = useQuery<WorkspaceMemberWithUser[]>({
    queryKey: ['/api/workspaces', currentWorkspace?.id, 'members'],
    queryFn: async () => {
      if (!currentWorkspace?.id) return []
      const response = await fetch(`/api/workspaces/${currentWorkspace.id}/members`, {
        credentials: 'include'
      })
      if (!response.ok) throw new Error('Failed to fetch members')
      return response.json()
    },
    enabled: !!currentWorkspace?.id && currentWorkspace.type === 'team'
  })

  // Transform backend data to Member interface
  const members = membersWithUsers.map(transformMemberData)

  // Filter members based on search and role filter
  const filteredMembers = members.filter(member => {
    const matchesSearch = 
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.username.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesRole = roleFilter === 'all' || member.role.toLowerCase() === roleFilter.toLowerCase()
    
    return matchesSearch && matchesRole
  })

  const memberCount = members.length
  const adminCount = members.filter(m => m.role === 'Admin').length
  const memberOnlyCount = members.filter(m => m.role === 'Member').length
  const guestCount = members.filter(m => m.role === 'Guest').length

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-center flex-1">
          <div className="text-center">
            <Users className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground">Loading members...</p>
          </div>
        </div>
      </div>
    )
  }

  // Show message for personal workspaces
  if (currentWorkspace?.type === 'personal') {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-center flex-1">
          <div className="text-center">
            <Users className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground">Members are only available for team workspaces</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b bg-background">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
            <span className="text-xs text-primary-foreground font-bold">R</span>
          </div>
          <div>
            <h1 className="text-xl font-semibold" data-testid="text-page-title">
              Members
            </h1>
            <p className="text-sm text-muted-foreground">{currentWorkspace?.name || 'Loading...'}</p>
          </div>
        </div>
        
        <Button className="gap-2" data-testid="button-add-member">
          <Plus className="w-4 h-4" />
          Add
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 lg:w-96">
              <TabsTrigger value="members" data-testid="tab-members">
                Members
              </TabsTrigger>
              <TabsTrigger value="viewers" data-testid="tab-viewers">
                Viewers
              </TabsTrigger>
              <TabsTrigger value="invites" data-testid="tab-invites">
                Invites
              </TabsTrigger>
              <TabsTrigger value="upgrade-requests" data-testid="tab-upgrade-requests">
                Upgrade requests
              </TabsTrigger>
            </TabsList>

            <TabsContent value="members" className="space-y-4">
              {/* Search and Filters */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, email, or username"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                      data-testid="input-search-members"
                    />
                  </div>
                  
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-40" data-testid="select-filter-role">
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All roles</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="guest">Guest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button variant="outline" className="gap-2" data-testid="button-download-csv">
                  <Download className="w-4 h-4" />
                  Download CSV
                </Button>
              </div>

              {/* Members Table */}
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-sm">Name</th>
                      <th className="text-left py-3 px-4 font-medium text-sm">Email</th>
                      <th className="text-left py-3 px-4 font-medium text-sm">Role</th>
                      <th className="text-left py-3 px-4 font-medium text-sm">Last Active</th>
                      <th className="text-left py-3 px-4 font-medium text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMembers.map((member) => (
                      <MemberRow key={member.id} member={member} />
                    ))}
                  </tbody>
                </table>
                
                {filteredMembers.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-muted-foreground">
                      {searchQuery || roleFilter !== 'all' 
                        ? 'No members match your search criteria'
                        : 'No members found'
                      }
                    </p>
                  </div>
                )}
              </div>

              {/* Summary */}
              {filteredMembers.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  Showing {filteredMembers.length} of {memberCount} members
                  {roleFilter !== 'all' && ` with ${roleFilter} role`}
                </div>
              )}
            </TabsContent>

            <TabsContent value="viewers" className="space-y-4">
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground">No viewers found</p>
              </div>
            </TabsContent>

            <TabsContent value="invites" className="space-y-4">
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground">No pending invites</p>
              </div>
            </TabsContent>

            <TabsContent value="upgrade-requests" className="space-y-4">
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground">No upgrade requests</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}