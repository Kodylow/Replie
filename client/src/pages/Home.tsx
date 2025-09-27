import MainContent from '@/components/MainContent'
import type { Project } from '@shared/schema'

interface HomeProps {
  searchResults: Project[]
  isSearching: boolean
}

export default function Home({ searchResults, isSearching }: HomeProps) {
  return (
    <MainContent 
      searchResults={searchResults}
      isSearching={isSearching}
    />
  )
}