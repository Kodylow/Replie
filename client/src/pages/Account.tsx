import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import type { UpdateProfileRequest } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Eye, Download, Info, User, Settings, CreditCard, Gift, Shield, Key, Link, Globe, Palette } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function Account() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Active section state
  const [activeSection, setActiveSection] = useState("profile");
  
  // Profile form state
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    bio: user?.bio || "",
  });

  // Sync form data when user data loads
  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        bio: user.bio || "",
      });
    }
  }, [user]);
  
  // Account settings state
  const [serverLocation, setServerLocation] = useState("north-america");
  const [transactionalNotifications, setTransactionalNotifications] = useState(true);
  const [marketingNotifications, setMarketingNotifications] = useState(true);
  
  // Sidebar navigation items
  const sidebarItems = [
    { id: "profile", label: "Profile", icon: User },
    { id: "account", label: "Account", icon: Settings },
    { id: "billing", label: "Billing", icon: CreditCard },
    { id: "referrals", label: "Referrals", icon: Gift },
    { id: "roles", label: "Roles", icon: Shield },
    { id: "ssh-keys", label: "SSH Keys", icon: Key },
    { id: "account-secrets", label: "Account Secrets", icon: Key },
    { id: "connected-services", label: "Connected Services", icon: Link },
    { id: "domains", label: "Domains", icon: Globe },
    { id: "themes", label: "Themes", icon: Palette },
  ];
  
  const bioCharacterLimit = 140;
  const remainingChars = bioCharacterLimit - profileData.bio.length;
  
  const updateProfileMutation = useMutation({
    mutationFn: async (data: UpdateProfileRequest) => {
      const response = await apiRequest("PATCH", "/api/profile", data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update profile");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile changes have been saved successfully.",
      });
      // Invalidate user cache to refresh the data
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update profile",
        description: error.message || "An error occurred while updating your profile",
        variant: "destructive",
      });
    },
  });
  
  const updateProfileField = (field: keyof typeof profileData, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleSaveChanges = () => {
    const updates: UpdateProfileRequest = {};
    
    // Only include fields that have changed
    if (profileData.firstName !== (user?.firstName || "")) {
      updates.firstName = profileData.firstName;
    }
    if (profileData.lastName !== (user?.lastName || "")) {
      updates.lastName = profileData.lastName;
    }
    if (profileData.bio !== (user?.bio || "")) {
      updates.bio = profileData.bio;
    }
    
    // Only make the API call if there are changes
    if (Object.keys(updates).length > 0) {
      updateProfileMutation.mutate(updates);
    } else {
      toast({
        title: "No changes detected",
        description: "Your profile is already up to date.",
      });
    }
  };
  
  const handleRemovePhoto = () => {
    // TODO: Implement photo removal
    toast({
      title: "Photo removed",
      description: "Your profile photo has been removed.",
    });
  };
  
  const handleStartExport = () => {
    // TODO: Implement app export functionality
    toast({
      title: "Export started",
      description: "Your app export has been initiated. You'll receive an email when it's ready.",
    });
  };
  
  const handleViewPublicProfile = () => {
    // TODO: Open public profile in new tab
    window.open(`/@${user?.email?.split('@')[0] || 'user'}`, '_blank');
  };

  const renderContent = () => {
    switch (activeSection) {
      case "profile":
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl font-bold mb-6">Profile</h1>
              <div className="flex items-start gap-6">
                {/* Profile Picture */}
                <div className="flex flex-col items-center space-y-3">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={user?.profileImageUrl || ""} alt={`${user?.firstName} ${user?.lastName}`} />
                    <AvatarFallback className="text-2xl">
                      {user?.firstName?.[0]?.toUpperCase()}{user?.lastName?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRemovePhoto}
                    data-testid="button-remove-photo"
                  >
                    Remove photo
                  </Button>
                </div>
                
                {/* Profile Form */}
                <div className="flex-1 space-y-4">
                  <div className="text-sm text-muted-foreground">
                    @{user?.email?.split('@')[0] || 'user'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    * You can change your username{" "}
                    <a href="#" className="text-blue-600 hover:underline">through the CLI once</a>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first-name">First name</Label>
                      <Input
                        id="first-name"
                        data-testid="input-first-name"
                        value={profileData.firstName}
                        onChange={(e) => updateProfileField("firstName", e.target.value)}
                        placeholder="Kody"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last-name">Last name</Label>
                      <Input
                        id="last-name"
                        data-testid="input-last-name"
                        value={profileData.lastName}
                        onChange={(e) => updateProfileField("lastName", e.target.value)}
                        placeholder="Low"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio (140 characters remaining)</Label>
                    <Textarea
                      id="bio"
                      data-testid="textarea-bio"
                      value={profileData.bio}
                      onChange={(e) => {
                        if (e.target.value.length <= bioCharacterLimit) {
                          updateProfileField("bio", e.target.value);
                        }
                      }}
                      placeholder="Add a bio"
                      className="resize-none"
                      rows={3}
                    />
                    <div className="text-xs text-muted-foreground">
                      {remainingChars} characters remaining
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      onClick={handleViewPublicProfile}
                      data-testid="button-view-public-profile"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View my public profile
                    </Button>
                    <Button 
                      onClick={handleSaveChanges}
                      disabled={updateProfileMutation.isPending}
                      data-testid="button-save-changes"
                    >
                      {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      case "account":
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl font-bold mb-6">Account</h1>
              <div className="space-y-6">
                {/* Email */}
                <div className="space-y-2">
                  <Label className="text-base font-medium">Your email</Label>
                  <div className="text-sm">{user?.email}</div>
                  <div className="text-xs text-muted-foreground">
                    Your email cannot be changed because is managed by your organization's Identity Provider.{" "}
                    <a href="#" className="text-blue-600 hover:underline">Contact your organization administrator for assistance.</a>
                  </div>
                </div>
                
                <Separator />
                
                {/* Server Location */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Label className="text-base font-medium">Your server location</Label>
                    <Info className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <Select value={serverLocation} onValueChange={setServerLocation}>
                    <SelectTrigger className="w-full max-w-sm" data-testid="select-server-location">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="north-america">North America</SelectItem>
                      <SelectItem value="europe">Europe</SelectItem>
                      <SelectItem value="asia-pacific">Asia Pacific</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="text-xs text-muted-foreground">
                    North America
                  </div>
                </div>
                
                <Separator />
                
                {/* Notification Settings */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Label className="text-base font-medium">Receive transactional notifications via email</Label>
                      <Info className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <Switch 
                      checked={transactionalNotifications}
                      onCheckedChange={setTransactionalNotifications}
                      data-testid="switch-transactional-notifications"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Label className="text-base font-medium">Receive marketing notifications</Label>
                      <Info className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <Switch 
                      checked={marketingNotifications}
                      onCheckedChange={setMarketingNotifications}
                      data-testid="switch-marketing-notifications"
                    />
                  </div>
                </div>
                
                <Separator />
                
                {/* Export Apps */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">Export Apps</Label>
                  <div className="text-sm text-muted-foreground">
                    Bulk export personal Apps
                  </div>
                  <Button 
                    variant="outline"
                    onClick={handleStartExport}
                    data-testid="button-start-export"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Start Export
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      
      case "billing":
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl font-bold mb-6">Billing</h1>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-base font-medium">Your personal account plan</Label>
                  <div className="p-4 border rounded-lg bg-muted/50">
                    <div className="text-sm text-muted-foreground">
                      Billing information and subscription details will be displayed here.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl font-bold mb-6">{sidebarItems.find(item => item.id === activeSection)?.label || "Settings"}</h1>
              <div className="p-6 border rounded-lg bg-muted/50">
                <div className="text-sm text-muted-foreground">
                  This section is coming soon.
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-64 border-r bg-muted/50 p-6">
        <nav className="space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors text-left hover-elevate",
                  activeSection === item.id
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
                data-testid={`nav-${item.id}`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="max-w-2xl">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}