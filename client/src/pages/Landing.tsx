import { Button } from '@/components/ui/button'

export default function Landing() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-xl mx-auto text-center px-6">
        <div className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: 'rgba(242, 98, 7, 0.15)', color: '#F26207' }}>
          {/* Replit logo */}
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M5.25 4.125C5.25 3.504 5.754 3 6.375 3h5.25c.621 0 1.125.504 1.125 1.125V9H6.375A1.125 1.125 0 0 1 5.25 7.875v-3.75ZM12.75 9h6.375c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125H12.75V9ZM5.25 16.125c0-.621.504-1.125 1.125-1.125h6.375v4.875c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 0 1-1.125-1.125v-3.75Z" />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-foreground mb-3">
          Replie - Prototyping Template for Replit.com
        </h1>
        <p className="text-muted-foreground mb-2">
        (excluding the Repl workspace. Working on it!).
        </p>
        <p className="text-muted-foreground mb-8">
          Remix this project to suggest new features or changes.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button 
            size="lg"
            className="bg-[#F26207] hover:bg-[#d95606] text-white"
            onClick={() => (window.location.href = '/api/login')}
            data-testid="button-login"
          >
            Sign in with Replit
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            className="border-[#F26207] text-[#F26207] hover:bg-[rgba(242,98,7,0.08)]"
            onClick={() => (window.open('https://replit.com/@kodylow/ReplitPrototyper?v=1#design_guidelines.md', '_blank'))}
            data-testid="button-remix"
          >
            Remix this project
          </Button>
        </div>
      </div>
    </div>
  )
}