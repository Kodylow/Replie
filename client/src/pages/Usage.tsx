import { useState } from 'react'
import { ChevronRight, ChevronDown, Info, ExternalLink, Bot, Globe } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

interface UsageResourceItem {
  name: string
  quotaUsed?: string
  quota?: string | number
  usageTotal: string | number
  unitPrice: string
  costAccount: string
  hasInfo?: boolean
}

interface UsageSection {
  name: string
  icon?: any
  items: UsageResourceItem[]
  isExpanded?: boolean
}

const USAGE_DATA: UsageSection[] = [
  {
    name: 'AI',
    icon: Bot,
    items: [
      {
        name: 'Agent Usage',
        usageTotal: '$746.92',
        unitPrice: 'Variable',
        costAccount: '$746.92',
        hasInfo: true
      },
      {
        name: 'Assistant (Edit requests)',
        quota: 0,
        usageTotal: '$0.05 / edit request',
        unitPrice: '$0.00',
        costAccount: '$0.00',
        hasInfo: true
      }
    ]
  },
  {
    name: 'Published Apps',
    icon: Globe,
    items: [
      {
        name: 'Outbound Data Transfer (GiB)',
        quotaUsed: '0%',
        quota: 1000,
        usageTotal: '0.20 GiB',
        unitPrice: '$0.1 / GiB',
        costAccount: '$0.00'
      },
      {
        name: 'Reserved VM Deployment (Compute hours)',
        quota: '-',
        usageTotal: 818,
        unitPrice: '-',
        costAccount: '$22.90'
      },
      {
        name: 'Autoscale Deployment (Deployments)',
        quota: '-',
        usageTotal: 1600,
        unitPrice: '$0.033 / day',
        costAccount: '$52.80'
      },
      {
        name: 'Autoscale Deployment (Compute units)',
        quota: '-',
        usageTotal: '964,481',
        unitPrice: '$3.20 / 1 million',
        costAccount: '$3.09'
      },
      {
        name: 'Autoscale Deployment (Requests)',
        quota: '-',
        usageTotal: 82,
        unitPrice: '$1.20 / 1 million',
        costAccount: '$0.00'
      },
      {
        name: 'Static Deployment (Count)',
        quotaUsed: '1%',
        quota: 200,
        usageTotal: 1,
        unitPrice: '-',
        costAccount: '$0.00'
      },
      {
        name: 'PostgreSQL Storage (GiB)',
        quota: '-',
        usageTotal: '9.56 GiB',
        unitPrice: '$1.5 / GiB',
        costAccount: '$14.34'
      },
      {
        name: 'PostgreSQL Compute (Hours)',
        quota: '-',
        usageTotal: '8.09',
        unitPrice: '$0.16 / hour',
        costAccount: '$1.29'
      },
      {
        name: 'Scheduled Deployment (Deployments)',
        quota: '-',
        usageTotal: 0,
        unitPrice: '$0.033 / day',
        costAccount: '$0.00'
      },
      {
        name: 'Scheduled Deployment (Compute units)',
        quota: '-',
        usageTotal: 0,
        unitPrice: '$3.20 / 1 million',
        costAccount: '$0.00'
      },
      {
        name: 'App Storage (GiB-months)',
        quota: '-',
        usageTotal: '0.08',
        unitPrice: '$0.03 / GiB / month',
        costAccount: '$0.00'
      }
    ]
  }
]

interface UsageProps {
  searchResults: any[]
  isSearching: boolean
}

function ResourceItem({ item }: { item: UsageResourceItem }) {
  return (
    <div className="flex items-center py-3 px-4 border-b border-border last:border-b-0 hover-elevate">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-sm font-medium truncate" data-testid={`text-resource-${item.name.toLowerCase().replace(/\s+/g, '-')}`}>
          {item.name}
        </span>
        {item.hasInfo && (
          <Info className="w-3 h-3 text-muted-foreground flex-shrink-0" />
        )}
      </div>
      
      <div className="flex items-center gap-8 text-sm">
        {item.quotaUsed && (
          <div className="w-16 text-center">
            <span className="text-muted-foreground">{item.quotaUsed}</span>
          </div>
        )}
        
        <div className="w-20 text-center">
          <span data-testid={`text-quota-${item.name.toLowerCase().replace(/\s+/g, '-')}`}>
            {item.quota || '-'}
          </span>
        </div>
        
        <div className="w-24 text-center">
          <span data-testid={`text-usage-${item.name.toLowerCase().replace(/\s+/g, '-')}`}>
            {item.usageTotal}
          </span>
        </div>
        
        <div className="w-28 text-center">
          <span className="text-muted-foreground" data-testid={`text-unit-price-${item.name.toLowerCase().replace(/\s+/g, '-')}`}>
            {item.unitPrice}
          </span>
        </div>
        
        <div className="w-20 text-right">
          <span className="font-medium" data-testid={`text-cost-${item.name.toLowerCase().replace(/\s+/g, '-')}`}>
            {item.costAccount}
          </span>
        </div>
      </div>
    </div>
  )
}

function UsageSection({ section }: { section: UsageSection }) {
  const [isOpen, setIsOpen] = useState(section.isExpanded ?? true)
  const IconComponent = section.icon
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <div className="flex items-center gap-2 p-4 hover-elevate cursor-pointer" data-testid={`button-toggle-${section.name.toLowerCase()}`}>
          {isOpen ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
          <IconComponent className="w-5 h-5" />
          <span className="text-lg font-medium">{section.name}</span>
        </div>
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <div className="border-t border-border">
          {/* Table Headers */}
          <div className="flex items-center py-2 px-4 bg-muted/50 text-xs font-medium text-muted-foreground border-b border-border">
            <div className="flex-1">Resource</div>
            <div className="flex items-center gap-8">
              <div className="w-16 text-center">Quota Used</div>
              <div className="w-20 text-center">Quota</div>
              <div className="w-24 text-center">Usage Total</div>
              <div className="w-28 text-center">Unit Price</div>
              <div className="w-20 text-center">Cost Account</div>
            </div>
          </div>
          
          {/* Items */}
          {section.items.map((item, index) => (
            <ResourceItem key={index} item={item} />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

export default function Usage({ searchResults = [], isSearching }: UsageProps) {
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
              Usage
            </h1>
            <p className="text-sm text-muted-foreground">Replit - Demo</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Billing Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg" data-testid="text-billing-overview">
                Billing overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Your plan */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Your plan</h3>
                  <div className="space-y-1">
                    <p className="font-semibold" data-testid="text-plan-name">Replit Teams</p>
                    <Button variant="ghost" size="sm" data-testid="button-manage-plan">
                      Manage
                    </Button>
                  </div>
                </div>

                {/* Monthly credits */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Monthly credits</h3>
                  <div className="space-y-1">
                    <p className="font-semibold" data-testid="text-monthly-credits">
                      $878.69 used of $1,200
                    </p>
                    <p className="text-xs text-muted-foreground">Resets in 13 days</p>
                  </div>
                </div>

                {/* Usage total */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Usage total</h3>
                  <div className="space-y-1">
                    <p className="font-semibold" data-testid="text-usage-total">0</p>
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <p>Usage alert: $0.01</p>
                      <p>Usage budget: $150</p>
                    </div>
                    <Button variant="ghost" size="sm" data-testid="button-manage-usage">
                      Manage
                    </Button>
                  </div>
                </div>

                {/* Usage period */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Usage period</h3>
                  <div className="space-y-1">
                    <p className="font-semibold" data-testid="text-usage-period">Sep 09 - Oct 09</p>
                    <p className="text-xs text-muted-foreground">Resets in 13 days</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resource Usage */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg" data-testid="text-resource-usage">
                  Resource usage
                </CardTitle>
              </div>
              <p className="text-sm text-muted-foreground">
                Updates take up to 1 hour and may not reflect the latest usage data.{' '}
                <Button variant="ghost" size="sm">
                  See previous invoices
                </Button>
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="border-t border-border">
                {USAGE_DATA.map((section, index) => (
                  <div key={index} className="border-b border-border last:border-b-0">
                    <UsageSection section={section} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}