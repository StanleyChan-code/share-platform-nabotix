import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  gradient?: string;
  loading?: boolean;
}

export function StatsCard({ title, value, description, icon: Icon, trend, gradient, loading }: StatsCardProps) {
  const cardClasses = cn(
    "h-full",
    gradient ? `bg-gradient-to-br ${gradient} text-white` : ""
  );

  return (
    <Card className={cardClasses}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className={cn(
          "text-sm font-medium",
          gradient ? "text-white" : ""
        )}>
          {title}
        </CardTitle>
        <Icon className={cn(
          "h-4 w-4",
          gradient ? "text-white" : "text-muted-foreground"
        )} />
      </CardHeader>
      <CardContent>
        <div className={cn(
          "text-2xl font-bold",
          gradient ? "text-white" : ""
        )}>
          {loading ? "..." : value}
        </div>
        {description && !loading && (
          <p className={cn(
            "text-xs mt-1",
            gradient ? "text-white/80" : "text-muted-foreground"
          )}>
            {description}
          </p>
        )}
        {trend && !loading && (
          <div className="flex items-center mt-1">
            <span
              className={cn(
                "text-xs font-medium",
                gradient
                  ? trend.isPositive
                    ? "text-green-300"
                    : "text-red-300"
                  : trend.isPositive
                    ? "text-green-600"
                    : "text-red-600"
              )}
            >
              {trend.isPositive ? "+" : ""}{trend.value}%
            </span>
            <span className={cn(
              "text-xs ml-1",
              gradient ? "text-white/80" : "text-muted-foreground"
            )}>
              vs last month
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}