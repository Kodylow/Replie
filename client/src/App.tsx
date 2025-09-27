import { useState } from 'react'
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import Sidebar from '@/components/Sidebar'
import MobileBottomNav from '@/components/MobileBottomNav'
import MobileHeader from '@/components/MobileHeader'
import MobileCreateTab from '@/components/MobileCreateTab'
import MobileAppsTab from '@/components/MobileAppsTab'
import MobileAccountTab from '@/components/MobileAccountTab'
import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import Projects from "@/pages/Projects";
import Apps from "@/pages/Apps";
import PublishedApps from "@/pages/PublishedApps";
import Usage from "@/pages/Usage";
import Analytics from "@/pages/Analytics";
import Members from "@/pages/Members";
import TeamCreation from "@/pages/TeamCreation";
import Account from "@/pages/Account";
import Import from "@/pages/Import";
import Planning from "@/pages/Planning";
import Editor from "@/pages/Editor";
import NotFound from "@/pages/not-found";
import ProjectDetail from "@/pages/ProjectDetail";
import type { Project } from '@shared/schema'

function Router({ searchResults, isSearching }: { searchResults: Project[], isSearching: boolean }) {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/projects">
            <Projects searchResults={searchResults} isSearching={isSearching} />
          </Route>
          <Route path="/apps">
            <Apps searchResults={searchResults} isSearching={isSearching} />
          </Route>
          <Route path="/published-apps">
            <PublishedApps searchResults={searchResults} isSearching={isSearching} />
          </Route>
          <Route path="/usage">
            <Usage searchResults={searchResults} isSearching={isSearching} />
          </Route>
          <Route path="/analytics">
            <Analytics searchResults={searchResults} isSearching={isSearching} />
          </Route>
          <Route path="/members">
            <Members searchResults={searchResults} isSearching={isSearching} />
          </Route>
          <Route path="/account" component={Account} />
          <Route path="/teams/new" component={TeamCreation} />
          <Route path="/import" component={Import} />
          <Route path="/planning" component={Planning} />
          <Route path="/editor/:appId" component={Editor} />
          <Route path="/project/:id" component={ProjectDetail} />
          <Route path="/">
            <Home searchResults={searchResults} isSearching={isSearching} />
          </Route>
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WorkspaceProvider>
          <AppContent />
        </WorkspaceProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const isMobile = useIsMobile();
  const [location] = useLocation();
  const [searchResults, setSearchResults] = useState<Project[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [mobileActiveTab, setMobileActiveTab] = useState<'apps' | 'create' | 'account'>('create')

  // Check if we're on a special page that should bypass mobile tabs
  const isSpecialPage = location === '/planning' || location.startsWith('/editor/') || location.startsWith('/project/') || location === '/import' || location === '/account'
  
  // Check if we're on the editor page (desktop and mobile)
  const isEditorPage = location.startsWith('/editor/')

  const handleSearchResults = (results: Project[]) => {
    setSearchResults(results)
    setIsSearching(true)
  }

  const handleClearSearch = () => {
    setSearchResults([])
    setIsSearching(false)
  }

  if (isLoading || !isAuthenticated) {
    return <Router searchResults={searchResults} isSearching={isSearching} />
  }

  // Mobile Layout
  if (isMobile) {
    // If we're on a special page, show the full router without mobile tabs
    if (isSpecialPage) {
      return (
        <div className="h-screen flex flex-col bg-background">
          <div className="flex-1 overflow-auto">
            <Router searchResults={searchResults} isSearching={isSearching} />
          </div>
        </div>
      );
    }

    // Otherwise, show the tab-based mobile layout
    return (
      <div className="h-screen flex flex-col bg-background">
        <MobileHeader />
        <div className="flex-1 overflow-auto">
          {mobileActiveTab === 'create' && <MobileCreateTab />}
          {mobileActiveTab === 'apps' && <MobileAppsTab />}
          {mobileActiveTab === 'account' && <MobileAccountTab />}
        </div>
        <MobileBottomNav
          activeTab={mobileActiveTab}
          onTabChange={setMobileActiveTab}
        />
      </div>
    );
  }

  // Desktop Layout
  // If we're on the planning page, show fullscreen without sidebar
  if (location === '/planning') {
    return (
      <div className="h-screen flex flex-col bg-background">
        <div className="flex-1 overflow-hidden">
          <Router searchResults={searchResults} isSearching={isSearching} />
        </div>
      </div>
    );
  }

  // Default desktop layout with sidebar
  return (
    <div className="h-screen flex bg-background">
      <Sidebar 
        onSearchResults={handleSearchResults}
        onClearSearch={handleClearSearch}
      />
      <div className="flex-1 flex flex-col">
        <main className="flex-1 overflow-hidden">
          <Router searchResults={searchResults} isSearching={isSearching} />
        </main>
      </div>
    </div>
  );
}

export default App;
