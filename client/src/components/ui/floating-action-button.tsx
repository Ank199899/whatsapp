import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Plus, MessageCircle, Users, Send } from "lucide-react";

interface FloatingActionButtonProps {
  onClick?: () => void;
  icon?: React.ComponentType<any>;
  className?: string;
  variant?: "primary" | "secondary" | "success" | "warning";
  size?: "sm" | "md" | "lg";
  tooltip?: string;
}

const FloatingActionButton = React.forwardRef<
  HTMLButtonElement,
  FloatingActionButtonProps
>(({ onClick, icon: Icon = Plus, className, variant = "primary", size = "md", tooltip, ...props }, ref) => {
  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-14 h-14", 
    lg: "w-16 h-16"
  };

  const variantClasses = {
    primary: "bg-gradient-to-r from-primary to-primary/80 hover:from-primary-hover hover:to-primary text-primary-foreground shadow-primary/30",
    secondary: "bg-gradient-to-r from-secondary to-secondary/80 hover:from-secondary-hover hover:to-secondary text-secondary-foreground shadow-secondary/30",
    success: "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-green-500/30",
    warning: "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-orange-500/30"
  };

  return (
    <Button
      ref={ref}
      onClick={onClick}
      className={cn(
        "fixed bottom-6 right-6 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-110 active:scale-95 z-50 group",
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      title={tooltip}
      {...props}
    >
      <Icon className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
    </Button>
  );
});

FloatingActionButton.displayName = "FloatingActionButton";

// Quick Action FAB with multiple options
interface QuickActionFABProps {
  actions: Array<{
    icon: React.ComponentType<any>;
    label: string;
    onClick: () => void;
    variant?: "primary" | "secondary" | "success" | "warning";
  }>;
  className?: string;
}

const QuickActionFAB: React.FC<QuickActionFABProps> = ({ actions, className }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className={cn("fixed bottom-6 right-6 z-50", className)}>
      {/* Action Items */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 space-y-3 animate-slide-up">
          {actions.map((action, index) => (
            <div
              key={index}
              className="flex items-center space-x-3 animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <span className="bg-card/90 backdrop-blur-sm text-foreground px-3 py-2 rounded-lg text-sm font-medium shadow-lg border border-border/50">
                {action.label}
              </span>
              <Button
                onClick={() => {
                  action.onClick();
                  setIsOpen(false);
                }}
                className={cn(
                  "w-12 h-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110",
                  action.variant === "success" && "bg-green-500 hover:bg-green-600 text-white",
                  action.variant === "warning" && "bg-orange-500 hover:bg-orange-600 text-white",
                  action.variant === "secondary" && "bg-secondary hover:bg-secondary-hover text-secondary-foreground",
                  !action.variant && "bg-primary hover:bg-primary-hover text-primary-foreground"
                )}
              >
                <action.icon className="w-5 h-5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Main FAB */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-14 h-14 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-110 active:scale-95 group",
          "bg-gradient-to-r from-primary to-primary/80 hover:from-primary-hover hover:to-primary text-primary-foreground"
        )}
      >
        <Plus className={cn(
          "w-6 h-6 transition-transform duration-300",
          isOpen ? "rotate-45" : "rotate-0"
        )} />
      </Button>
    </div>
  );
};

export { FloatingActionButton, QuickActionFAB };
