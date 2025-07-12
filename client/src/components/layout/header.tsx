import { Button } from "@/components/ui/button";
import { Bell, Plus } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { EnhancedWelcomeMessage, FloatingWordsWelcome } from "@/components/ui/animated-welcome-message";
import { BackgroundQuickSettings } from "@/components/ui/background-controls";

interface HeaderProps {
  title: string;
  subtitle?: string;
  primaryAction?: {
    label: string;
    onClick?: () => void;
    component?: React.ReactNode;
  };
  secondaryAction?: {
    label: string;
    onClick?: () => void;
    component?: React.ReactNode;
    icon?: React.ComponentType<any>;
  };
}

export default function Header({ title, subtitle, primaryAction, secondaryAction }: HeaderProps) {
  return (
    <header className="bg-card/80 backdrop-blur-md border-b border-border/50 px-6 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="animate-fade-in">
          <h2 className="text-3xl font-bold text-foreground mb-1">{title}</h2>
          {subtitle && (
            <div className="mt-1">
              {title === "Dashboard" ? (
                <EnhancedWelcomeMessage message={subtitle} />
              ) : (
                <FloatingWordsWelcome message={subtitle} />
              )}
            </div>
          )}
        </div>
        <div className="flex items-center space-x-3">
          {secondaryAction && (
            <div className="animate-slide-up" style={{ animationDelay: '100ms' }}>
              {secondaryAction.component ? secondaryAction.component : (
                <Button
                  variant="outline"
                  onClick={secondaryAction.onClick}
                  className="flex items-center hover:scale-105 transition-all duration-300 border-border/50 hover:border-primary/50 hover:shadow-md"
                >
                  {secondaryAction.icon && <secondaryAction.icon className="w-4 h-4 mr-2" />}
                  {secondaryAction.label}
                </Button>
              )}
            </div>
          )}
          {primaryAction && (
            <div className="animate-slide-up" style={{ animationDelay: '200ms' }}>
              {primaryAction.component ? primaryAction.component : (
                <Button
                  onClick={primaryAction.onClick}
                  className="btn-modern text-white font-semibold flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {primaryAction.label}
                </Button>
              )}
            </div>
          )}

          <div className="animate-slide-up" style={{ animationDelay: '300ms' }}>
            <BackgroundQuickSettings />
          </div>

          <div className="animate-slide-up" style={{ animationDelay: '350ms' }}>
            <ThemeToggle />
          </div>

          <div className="animate-slide-up" style={{ animationDelay: '400ms' }}>
            <Button
              variant="ghost"
              size="icon"
              className="hover:scale-110 transition-all duration-300 hover:bg-accent/50 rounded-xl relative"
            >
              <Bell className="w-5 h-5" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full animate-pulse"></div>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
