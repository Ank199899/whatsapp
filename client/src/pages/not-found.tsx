import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GradientText, AnimatedBackground } from "@/components/ui/modern-effects";
import { Home, ArrowLeft, Search, MessageCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background-secondary to-background-tertiary flex items-center justify-center p-4">
      <AnimatedBackground pattern="dots" className="absolute inset-0 opacity-30" />
      
      <Card className="card-modern max-w-md w-full text-center relative z-10 animate-bounce-in">
        <CardHeader className="pb-4">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center animate-pulse">
            <Search className="w-12 h-12 text-white" />
          </div>
          <CardTitle className="text-4xl font-bold mb-2">
            <GradientText gradient="primary">404</GradientText>
          </CardTitle>
          <h2 className="text-xl font-semibold text-foreground mb-2">Page Not Found</h2>
          <p className="text-muted-foreground">
            Oops! The page you're looking for doesn't exist or has been moved.
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Button 
              onClick={() => window.location.href = "/"}
              className="w-full btn-modern"
            >
              <Home className="w-4 h-4 mr-2" />
              Go to Dashboard
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => window.history.back()}
              className="w-full hover:scale-105 transition-all duration-300"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
            
            <Button 
              variant="ghost"
              onClick={() => window.location.href = "/inbox"}
              className="w-full hover:scale-105 transition-all duration-300"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Check Inbox
            </Button>
          </div>
          
          <div className="pt-4 border-t border-border/50">
            <p className="text-sm text-muted-foreground">
              Need help? Contact our support team.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
