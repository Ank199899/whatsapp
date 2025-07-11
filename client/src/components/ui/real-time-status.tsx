import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import useComprehensiveRealTimeSync from '@/hooks/useComprehensiveRealTimeSync';

interface RealTimeStatusProps {
  className?: string;
  showText?: boolean;
}

export function RealTimeStatus({ className, showText = true }: RealTimeStatusProps) {
  const { isConnected } = useComprehensiveRealTimeSync();

  return (
    <Badge 
      variant={isConnected ? "default" : "destructive"} 
      className={cn(
        "flex items-center gap-1 transition-all duration-300",
        isConnected ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600",
        className
      )}
    >
      {isConnected ? (
        <>
          <Zap className="h-3 w-3" />
          {showText && "Live"}
        </>
      ) : (
        <>
          <WifiOff className="h-3 w-3" />
          {showText && "Offline"}
        </>
      )}
    </Badge>
  );
}

interface DetailedRealTimeStatusProps {
  className?: string;
}

export function DetailedRealTimeStatus({ className }: DetailedRealTimeStatusProps) {
  const { isConnected } = useComprehensiveRealTimeSync();

  return (
    <div className={cn("flex items-center gap-2 text-sm", className)}>
      <div className={cn(
        "w-2 h-2 rounded-full transition-all duration-300",
        isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
      )} />
      <span className={cn(
        "font-medium transition-colors duration-300",
        isConnected ? "text-green-700" : "text-red-700"
      )}>
        {isConnected ? "Real-time sync active" : "Real-time sync disconnected"}
      </span>
      {isConnected && (
        <Zap className="h-4 w-4 text-green-600" />
      )}
    </div>
  );
}

export default RealTimeStatus;
