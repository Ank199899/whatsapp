import React, { useState } from 'react';
import { Settings, Eye, EyeOff, Sparkles, Zap, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useBackgroundControls } from './professional-mouse-background';
import { cn } from '@/lib/utils';

// Quick toggle button for header/toolbar
export const BackgroundToggleButton: React.FC<{ className?: string }> = ({ className }) => {
  const { isEnabled, toggleBackground } = useBackgroundControls();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleBackground}
      className={cn(
        "relative transition-all duration-200",
        isEnabled ? "text-primary" : "text-muted-foreground",
        className
      )}
      title={`${isEnabled ? 'Disable' : 'Enable'} background effects`}
    >
      {isEnabled ? (
        <Eye className="h-4 w-4" />
      ) : (
        <EyeOff className="h-4 w-4" />
      )}
      {isEnabled && (
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse" />
      )}
    </Button>
  );
};

// Dropdown menu for quick settings
export const BackgroundQuickSettings: React.FC<{ className?: string }> = ({ className }) => {
  const { isEnabled, toggleBackground, intensity, setIntensity } = useBackgroundControls();

  const intensityOptions = [
    { value: 'minimal', label: 'Minimal', icon: Star, description: 'Very subtle effects' },
    { value: 'subtle', label: 'Subtle', icon: Sparkles, description: 'Balanced experience' },
    { value: 'elegant', label: 'Elegant', icon: Zap, description: 'Rich animations' }
  ] as const;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "relative transition-all duration-200",
            isEnabled ? "text-primary" : "text-muted-foreground",
            className
          )}
        >
          <Settings className="h-4 w-4" />
          {isEnabled && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center justify-between">
          Background Effects
          <Switch
            checked={isEnabled}
            onCheckedChange={toggleBackground}
            className="ml-2"
          />
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {isEnabled && (
          <>
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Intensity Level
            </DropdownMenuLabel>
            {intensityOptions.map((option) => {
              const Icon = option.icon;
              return (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => setIntensity(option.value)}
                  className={cn(
                    "flex items-center justify-between cursor-pointer",
                    intensity === option.value && "bg-accent"
                  )}
                >
                  <div className="flex items-center space-x-2">
                    <Icon className="h-4 w-4" />
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-xs text-muted-foreground">{option.description}</div>
                    </div>
                  </div>
                  {intensity === option.value && (
                    <Badge variant="secondary" className="text-xs">Active</Badge>
                  )}
                </DropdownMenuItem>
              );
            })}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Full control panel for settings page
export const BackgroundControlPanel: React.FC<{ className?: string }> = ({ className }) => {
  const { isEnabled, toggleBackground, intensity, setIntensity } = useBackgroundControls();
  const [showPreview, setShowPreview] = useState(false);

  const intensityOptions = [
    { 
      value: 'minimal', 
      label: 'Minimal', 
      icon: Star, 
      description: 'Very subtle effects with minimal particles',
      particles: '8 particles',
      performance: 'Excellent'
    },
    { 
      value: 'subtle', 
      label: 'Subtle', 
      icon: Sparkles, 
      description: 'Balanced experience with moderate effects',
      particles: '15 particles',
      performance: 'Good'
    },
    { 
      value: 'elegant', 
      label: 'Elegant', 
      icon: Zap, 
      description: 'Rich animations with enhanced visual appeal',
      particles: '25 particles',
      performance: 'Fair'
    }
  ] as const;

  return (
    <Card className={cn("w-full max-w-2xl", className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Background Effects</span>
          </div>
          <Switch
            checked={isEnabled}
            onCheckedChange={toggleBackground}
          />
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Customize the interactive mouse-following background effects throughout the application.
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Main Toggle */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-1">
            <Label className="text-base font-medium">
              Enable Background Effects
            </Label>
            <p className="text-sm text-muted-foreground">
              Turn on interactive mouse-following animations
            </p>
          </div>
          <Switch
            checked={isEnabled}
            onCheckedChange={toggleBackground}
          />
        </div>

        {/* Intensity Settings */}
        {isEnabled && (
          <div className="space-y-4">
            <Label className="text-base font-medium">Intensity Level</Label>
            <div className="grid gap-3">
              {intensityOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = intensity === option.value;
                
                return (
                  <div
                    key={option.value}
                    className={cn(
                      "p-4 border rounded-lg cursor-pointer transition-all duration-200",
                      isSelected 
                        ? "border-primary bg-primary/5 shadow-sm" 
                        : "border-border hover:border-primary/50 hover:bg-accent/50"
                    )}
                    onClick={() => setIntensity(option.value)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className={cn(
                          "p-2 rounded-md",
                          isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                        )}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="space-y-1">
                          <div className="font-medium">{option.label}</div>
                          <p className="text-sm text-muted-foreground">
                            {option.description}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <span>{option.particles}</span>
                            <span>•</span>
                            <span>Performance: {option.performance}</span>
                          </div>
                        </div>
                      </div>
                      {isSelected && (
                        <Badge variant="default" className="text-xs">
                          Active
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Preview Toggle */}
        {isEnabled && (
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label className="text-base font-medium">
                Preview Mode
              </Label>
              <p className="text-sm text-muted-foreground">
                Temporarily enhance effects to preview the selected intensity
              </p>
            </div>
            <Button
              variant={showPreview ? "default" : "outline"}
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? "Hide Preview" : "Show Preview"}
            </Button>
          </div>
        )}

        {/* Performance Note */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium mb-1">Performance Tips</p>
              <ul className="text-muted-foreground space-y-1">
                <li>• Use "Minimal" for better performance on slower devices</li>
                <li>• Effects are automatically disabled during intensive tasks</li>
                <li>• Settings are saved locally and persist across sessions</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
