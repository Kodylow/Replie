import { Button } from '@/components/ui/button'

export default function Landing() {
  return (
    <div className="min-h-screen flex items-center bg-background">
      <div className="max-w-7xl mx-auto px-6 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Content */}
          <div className="space-y-8">
            <div className="w-16 h-16 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(242, 98, 7, 0.15)' }}>
              <img 
                src="/replie.png" 
                alt="Replie" 
                className="w-10 h-10 object-contain"
              />
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl lg:text-5xl font-bold text-foreground leading-tight">
                Replie - Prototyping Template for Replit.com
              </h1>
              <p className="text-lg text-muted-foreground">
                (excluding the Repl workspace. Working on it!).
              </p>
              <p className="text-lg text-muted-foreground">
                Remix this project to suggest new features or changes to Replit.com 
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg"
                className="bg-[#F26207] hover:bg-[#d95606] text-white px-8 py-3 text-lg"
                onClick={() => (window.location.href = '/api/login')}
                data-testid="button-login"
              >
                Sign in with Replit
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="border-[#F26207] text-[#F26207] hover:bg-[rgba(242,98,7,0.08)] px-8 py-3 text-lg"
                onClick={() => (window.open('https://replit.com/@kodylow/ReplitPrototyper?v=1#design_guidelines.md', '_blank'))}
                data-testid="button-remix"
              >
                Remix this project
              </Button>
            </div>
          </div>

          {/* Right side - Replie Image */}
          <div className="flex justify-center lg:justify-end">
            <div className="max-w-md lg:max-w-lg">
              <img 
                src="/replie.png" 
                alt="Replie - Replit Workspace Clone" 
                className="w-full h-auto object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}