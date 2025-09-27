import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { CreateTeamRequest } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Check, CreditCard, Building } from "lucide-react";

interface TeamFormData {
  organizationName: string;
  useCase: string;
  description: string;
  billingEmail: string;
  inviteEmails: string;
  plan: "teams" | "enterprise";
}

function normalizeEmails(value: string): string {
  const emails = value
    .split(/[\s,]+/)
    .map((e) => e.trim())
    .filter((e) => e.length > 0);
  return Array.from(new Set(emails)).join(", ");
}

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center mb-8">
      <div className="flex items-center space-x-4">
        <div className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            currentStep >= 1 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            1
          </div>
          <span className="ml-2 text-sm font-medium">Setup</span>
        </div>
        <div className="w-8 h-px bg-gray-300"></div>
        <div className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            currentStep >= 2 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            2
          </div>
          <span className="ml-2 text-sm font-medium">Select a plan</span>
        </div>
        <div className="w-8 h-px bg-gray-300"></div>
        <div className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            currentStep >= 3 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            3
          </div>
          <span className="ml-2 text-sm font-medium">Payment</span>
        </div>
      </div>
    </div>
  );
}

function SetupStep({ formData, updateFormData }: { formData: TeamFormData; updateFormData: (field: keyof TeamFormData, value: string) => void }) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Set up your organization</h1>
        <p className="text-muted-foreground">Start by telling us a bit about your organization.</p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="org-name">Organization name <span className="text-red-500">Required</span></Label>
            <Input
              id="org-name"
              data-testid="input-organization-name"
              placeholder="Enter organization name"
              value={formData.organizationName}
              onChange={(e) => updateFormData("organizationName", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="use-case">What do you plan to use Replit for? <span className="text-red-500">Required</span></Label>
            <Select value={formData.useCase} onValueChange={(value) => updateFormData("useCase", value)}>
              <SelectTrigger data-testid="select-use-case">
                <SelectValue placeholder="Select a use case" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="education">Education</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="personal">Personal projects</SelectItem>
                <SelectItem value="enterprise">Enterprise development</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Care to share more about what you'll build? <span className="text-muted-foreground">Optional</span></Label>
            <Textarea
              id="description"
              data-testid="textarea-description"
              placeholder="My team wants to use Replit to build..."
              value={formData.description}
              onChange={(e) => updateFormData("description", e.target.value)}
              className="resize-none"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="billing-email">Billing email <span className="text-red-500">Required</span></Label>
            <Input
              id="billing-email"
              data-testid="input-billing-email"
              type="email"
              placeholder="kody.low@repl.it"
              value={formData.billingEmail}
              onChange={(e) => updateFormData("billingEmail", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="invite-emails">Invite team members <span className="text-muted-foreground">Comma-separated list of emails</span></Label>
            <Textarea
              id="invite-emails"
              data-testid="textarea-invite-emails"
              placeholder="Enter email addresses..."
              value={formData.inviteEmails}
              onChange={(e) => updateFormData("inviteEmails", e.target.value)}
              onBlur={(e) => updateFormData("inviteEmails", normalizeEmails(e.target.value))}
              onKeyDown={(e) => {
                if (e.key === 'Tab') {
                  const target = e.target as HTMLTextAreaElement;
                  updateFormData("inviteEmails", normalizeEmails(target.value));
                }
              }}
              className="resize-none"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PlanStep({ formData, updateFormData }: { formData: TeamFormData; updateFormData: (field: keyof TeamFormData, value: string) => void }) {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Select a plan</h1>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Card className={`cursor-pointer transition-all ${formData.plan === "teams" ? "ring-2 ring-blue-500" : ""}`}>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Teams</CardTitle>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">Monthly</Badge>
                  <Badge variant="outline">Annual</Badge>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">$40</div>
                <div className="text-sm text-muted-foreground">per user<br />per month</div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Bring the power of Replit to your entire team.
            </p>
            <Button 
              data-testid="button-select-teams-plan"
              className="w-full mt-4" 
              variant={formData.plan === "teams" ? "default" : "outline"}
              onClick={() => updateFormData("plan", "teams")}
            >
              Continue {formData.plan === "teams" && <Check className="w-4 h-4 ml-2" />}
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>Unlimited private projects</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>$40 credits per user per month</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>50 Viewer seats</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>Powerful workspace (8 vCPU/16 GiB RAM)</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>Advanced AI access for the whole team</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>Centralized billing</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>Role-based access control</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <div>
              <CardTitle className="text-xl">Enterprise</CardTitle>
              <div className="mt-4">
                <div className="text-2xl font-bold">Custom pricing</div>
                <p className="text-sm text-muted-foreground mt-2">
                  Meet your security and performance needs.
                </p>
              </div>
              <Button data-testid="button-contact-enterprise" variant="outline" className="w-full mt-4">
                Contact Us
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>Everything in Teams</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>Custom Viewers</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>SSO/SAML</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>SCIM</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>Advanced privacy controls</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>Custom pricing</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>Dedicated support</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PaymentStep({ onDevBypass }: { onDevBypass?: () => void }) {
  const isDevelopment = import.meta.env.DEV;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Enter payment information</h1>
      </div>

      {isDevelopment && onDevBypass && (
        <div className="mb-6">
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-amber-800">Development Mode</h3>
                  <p className="text-sm text-amber-700">Skip payment and create team directly</p>
                </div>
                <Button 
                  onClick={onDevBypass}
                  variant="outline"
                  className="border-amber-300 bg-amber-100 text-amber-800 hover:bg-amber-200"
                  data-testid="button-dev-bypass"
                >
                  Create Team (Dev)
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Replit Teams Membership</CardTitle>
              <div className="text-xl font-bold">$80.00 / month</div>
            </div>
            <p className="text-sm text-muted-foreground">$40.00 / month • 2 seats</p>
          </CardHeader>
        </Card>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            This plan will be billed separately from your personal account, which is subscribed to Replit Core. 
            After your purchase, you can cancel your personal plan from your account settings.
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="flex gap-4">
                <Button variant="outline" className="flex-1" data-testid="button-card-payment">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Card
                </Button>
                <Button variant="outline" className="flex-1" disabled>
                  <Building className="w-4 h-4 mr-2" />
                  Bank
                  <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800 text-xs">$5 back</Badge>
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="card-number">Card number</Label>
                <Input 
                  id="card-number"
                  data-testid="input-card-number"
                  placeholder="1234 1234 1234 1234" 
                  disabled
                />
                <div className="flex gap-4 mt-2">
                  <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCA0MCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjI0IiByeD0iNCIgZmlsbD0iIzAwNTFBNSIvPgo8dGV4dCB4PSI1IiB5PSIxNSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjgiIGZpbGw9IndoaXRlIj5WSVNBPC90ZXh0Pgo8L3N2Zz4K" alt="Visa" className="w-8 h-5" />
                  <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCA0MCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjI0IiByeD0iNCIgZmlsbD0iI0ZGNTgwMCIvPgo8dGV4dCB4PSI1IiB5PSIxNSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjgiIGZpbGw9IndoaXRlIj5NQVNURVJDQVJEPC90ZXh0Pgo8L3N2Zz4K" alt="Mastercard" className="w-8 h-5" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiry">Expiration date</Label>
                  <Input 
                    id="expiry"
                    data-testid="input-expiry-date"
                    placeholder="MM / YY" 
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cvc">Security code</Label>
                  <Input 
                    id="cvc"
                    data-testid="input-security-code"
                    placeholder="CVC" 
                    disabled
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="full-name">Full name</Label>
                <Input 
                  id="full-name"
                  data-testid="input-full-name"
                  placeholder="Full name on card" 
                  disabled
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country or region</Label>
                <Select disabled>
                  <SelectTrigger data-testid="select-country">
                    <SelectValue placeholder="United States" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="us">United States</SelectItem>
                    <SelectItem value="ca">Canada</SelectItem>
                    <SelectItem value="uk">United Kingdom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input 
                  id="address"
                  data-testid="input-address"
                  placeholder="Address" 
                  disabled
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button size="lg" className="w-full" data-testid="button-confirm-purchase" disabled>
            <CreditCard className="w-4 h-4 mr-2" />
            Confirm Purchase
          </Button>
          <p className="text-xs text-muted-foreground mt-4">
            By completing this purchase and adding this payment method, you agree to the{" "}
            <a href="#" className="text-blue-600 hover:underline">Teams Agreement</a>, as well as our payment provider's{" "}
            <a href="#" className="text-blue-600 hover:underline">Terms</a> and{" "}
            <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function TeamCreation() {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<TeamFormData>({
    organizationName: "",
    useCase: "",
    description: "",
    billingEmail: "",
    inviteEmails: "",
    plan: "teams"
  });

  const createTeamMutation = useMutation({
    mutationFn: async (data: CreateTeamRequest) => {
      const response = await apiRequest("POST", "/api/teams", data);
      return response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Team created successfully!",
        description: `Welcome to ${data.workspace.name}`,
      });
      // Invalidate workspaces cache to refresh the sidebar
      queryClient.invalidateQueries({ queryKey: ["/api/workspaces"] });
      // Redirect to the new workspace
      setLocation("/projects");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create team",
        description: error.message || "An error occurred while creating the team",
        variant: "destructive",
      });
    },
  });

  const updateFormData = (field: keyof TeamFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleContinue = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      // Handle final submission - create the team
      handleCreateTeam();
    }
  };

  const handleCreateTeam = () => {
    const teamData: CreateTeamRequest = {
      organizationName: formData.organizationName,
      useCase: formData.useCase,
      description: formData.description || undefined,
      billingEmail: formData.billingEmail,
      inviteEmails: formData.inviteEmails || undefined,
      plan: formData.plan,
    };
    createTeamMutation.mutate(teamData);
  };

  const canContinue = () => {
    switch (currentStep) {
      case 1:
        return formData.organizationName.trim() && formData.useCase && formData.billingEmail.trim();
      case 2:
        return formData.plan;
      case 3:
        return true; // Mock step, always allow continue
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      {/* Replit Teams Header */}
      <div className="fixed top-0 right-0 w-96 h-screen bg-gray-50 border-l p-8 overflow-y-auto">
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-[#F26207]">
              <path d="M5.25 4.125C5.25 3.504 5.754 3 6.375 3h5.25c.621 0 1.125.504 1.125 1.125V9H6.375A1.125 1.125 0 0 1 5.25 7.875v-3.75ZM12.75 9h6.375c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125H12.75V9ZM5.25 16.125c0-.621.504-1.125 1.125-1.125h6.375v4.875c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 0 1-1.125-1.125v-3.75Z" />
            </svg>
            <h2 className="text-2xl font-bold">Replit Teams</h2>
          </div>
          
          <p className="text-sm text-muted-foreground">
            The launchpad for your team's most important work. Purpose-built to help your team move faster and ship higher quality software.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-sm font-medium">Starts at $40/user per month</div>
            <a href="#" className="text-sm text-blue-600 hover:underline">Learn more</a>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              </div>
              <div>
                <div className="font-medium text-sm">Unlimited creations in a more powerful workspace</div>
                <div className="text-xs text-muted-foreground">Create unlimited Apps with unlimited editors<br />5x more storage, 10x more power<br />Access to Claude Sonnet 4 & OpenAI GPT-4o</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              </div>
              <div>
                <div className="font-medium text-sm">Collaborate seamlessly with Projects</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              </div>
              <div>
                <div className="font-medium text-sm">Publish a Company Profile to share your work</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              </div>
              <div>
                <div className="font-medium text-sm">Role-based permissions for Apps and Deployments</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              </div>
              <div>
                <div className="font-medium text-sm">$40/mo in usage credits included</div>
                <div className="text-xs text-muted-foreground">Credits granted upfront with annual plan</div>
              </div>
            </div>
          </div>

          <Separator />

          <div className="bg-gray-100 rounded-lg p-4">
            <p className="text-sm italic text-gray-700">
              "We use Replit internally to prototype new types of Assistants before pushing them to production. It allows us to rapidly deploy our environment and try out new features, making sure they work in production and in our SDKs."
            </p>
            <div className="flex items-center gap-2 mt-3">
              <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
              <div>
                <div className="text-sm font-medium">Ismail Pelaseyed</div>
                <div className="text-xs text-muted-foreground">Co-founder, SUPERAGENT.SH</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto pr-96">
        <StepIndicator currentStep={currentStep} />
        
        {currentStep === 1 && (
          <SetupStep formData={formData} updateFormData={updateFormData} />
        )}
        {currentStep === 2 && (
          <PlanStep formData={formData} updateFormData={updateFormData} />
        )}
        {currentStep === 3 && <PaymentStep onDevBypass={handleCreateTeam} />}

        <div className="flex justify-center mt-8">
          <Button 
            size="lg" 
            onClick={handleContinue}
            disabled={!canContinue() || createTeamMutation.isPending}
            data-testid="button-continue"
          >
            {currentStep === 3 
              ? (createTeamMutation.isPending ? "Creating Team..." : "Create Team") 
              : "Continue"
            }
          </Button>
        </div>
      </div>
    </div>
  );
}