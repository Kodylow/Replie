import { Button } from '@/components/ui/button'

export default function Landing() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md mx-auto text-center px-6">
        <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center mx-auto mb-6">
          <span className="text-primary-foreground font-bold text-2xl">R</span>
        </div>
        
        <h1 className="text-3xl font-bold text-foreground mb-4">
          Welcome to Replit Dashboard
        </h1>
        
        <p className="text-muted-foreground mb-8">
          Create, manage, and deploy your projects with ease. Sign in to get started.
        </p>
        
        <Button 
          size="lg" 
          className="w-full"
          onClick={() => window.location.href = '/api/login'}
          data-testid="button-login"
        >
          Sign In
        </Button>
      </div>
    </div>
  )
}