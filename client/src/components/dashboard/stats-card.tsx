import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: number;
  suffix?: string;
  icon: LucideIcon;
  color: 'green' | 'lightGreen' | 'darkGreen' | 'primary' | 'secondary' | 'accent';
  trend?: {
    value?: number;
    label: string;
    suffix?: string;
  };
  loading?: boolean;
}

const colorClasses = {
  green: 'bg-green-100 text-green-600',
  lightGreen: 'bg-green-50 text-green-500',
  darkGreen: 'bg-green-200 text-green-700',
  primary: 'bg-primary/10 text-primary',
  secondary: 'bg-secondary text-secondary-foreground',
  accent: 'bg-accent text-accent-foreground',
};

export default function StatsCard({ 
  title, 
  value, 
  suffix, 
  icon: Icon, 
  color, 
  trend, 
  loading 
}: StatsCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">{title}</p>
            {loading ? (
              <div className="animate-pulse bg-gray-200 h-8 w-16 rounded mt-1"></div>
            ) : (
              <p className="text-2xl font-bold text-gray-800">
                {value.toLocaleString()}{suffix}
              </p>
            )}
          </div>
          <div className={cn("p-3 rounded-full", colorClasses[color])}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
        {trend && (
          <div className="mt-4 flex items-center text-sm">
            {trend.value && (
              <span className="text-green-500 font-medium">
                +{trend.value}{trend.suffix || ''}
              </span>
            )}
            <span className={cn("ml-1 text-gray-500", trend.value ? "" : "text-green-500 font-medium")}>
              {trend.label}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
