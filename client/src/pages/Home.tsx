import { useState } from 'react'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import MainContent from '@/components/MainContent'
import type { Project } from '@shared/schema'

export default function Home() {
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
    <div className="h-screen flex bg-background">
      <Sidebar 
        onSearchResults={handleSearchResults}
        onClearSearch={handleClearSearch}
      />
      <div className="flex-1 flex flex-col">
        <Header />
        <MainContent 
          searchResults={searchResults}
          isSearching={isSearching}
        />
      </div>
    </div>
  )
}