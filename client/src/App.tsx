import { useState } from 'react'
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import Home from "@/pages/Home";
import Projects from "@/pages/Projects";
import Apps from "@/pages/Apps";
import NotFound from "@/pages/not-found";
import ProjectDetail from "@/pages/ProjectDetail";
import type { Project } from '@shared/schema'

function Router({ searchResults, isSearching }: { searchResults: Project[], isSearching: boolean }) {
  return (
    <Switch>
      <Route path="/projects">
        <Projects searchResults={searchResults} isSearching={isSearching} />
      </Route>
      <Route path="/apps">
        <Apps searchResults={searchResults} isSearching={isSearching} />
      </Route>
      <Route path="/project/:id" component={ProjectDetail} />
      <Route path="/">
        <Home searchResults={searchResults} isSearching={isSearching} />
      </Route>
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
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

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="h-screen flex bg-background">
          <Sidebar 
            onSearchResults={handleSearchResults}
            onClearSearch={handleClearSearch}
          />
          <div className="flex-1 flex flex-col">
            <Header />
            <main className="flex-1 overflow-hidden">
              <Router searchResults={searchResults} isSearching={isSearching} />
            </main>
          </div>
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
