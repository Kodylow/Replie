import { useState } from 'react'
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import Sidebar from '@/components/Sidebar'
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
  const [searchResults, setSearchResults] = useState<Project[]>([])
  const [isSearching, setIsSearching] = useState(false)

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
