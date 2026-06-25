"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/cn';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

type Accent = 'primary' | 'emerald' | 'teal' | 'blue' | 'amber' | 'violet' | 'rose';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  accent?: Accent;
  className?: string;
}

const accentMap: Record<Accent, string> = {
  primary: 'from-emerald-500 to-teal-500',
  emerald: 'from-emerald-500 to-green-600',
  teal: 'from-teal-500 to-cyan-600',
  blue: 'from-sky-500 to-blue-600',
  amber: 'from-amber-400 to-orange-500',
  violet: 'from-violet-500 to-purple-600',
  rose: 'from-rose-500 to-pink-600',
};

export default function StatsCard({
  title,
  value,
  icon,
  description,
  trend,
  trendValue,
  accent = 'primary',
  className,
}: StatsCardProps) {
  return (
    <Card
      className={cn(
        "group relative overflow-hidden border-border/70 card-elevated transition-all duration-300 hover:-translate-y-1 hover:shadow-xl",
        className
      )}
    >
      {/* subtle accent wash */}
      <div
        className={cn(
          "pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full bg-gradient-to-br opacity-10 blur-2xl transition-opacity duration-300 group-hover:opacity-20",
          accentMap[accent]
        )}
      />
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted-foreground truncate">{title}</p>
            <p className="text-2xl sm:text-3xl font-bold mt-1.5 tracking-tight text-foreground">{value}</p>
            {(trend || description) && (
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                {trend && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
                      trend === 'up' && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                      trend === 'down' && "bg-rose-500/10 text-rose-600 dark:text-rose-400",
                      trend === 'neutral' && "bg-muted text-muted-foreground"
                    )}
                  >
                    {trend === 'up' && <TrendingUp size={12} />}
                    {trend === 'down' && <TrendingDown size={12} />}
                    {trend === 'neutral' && <Minus size={12} />}
                    {trendValue}
                  </span>
                )}
                {description && (
                  <span className="text-xs text-muted-foreground">{description}</span>
                )}
              </div>
            )}
          </div>
          <div
            className={cn(
              "grid place-items-center h-12 w-12 shrink-0 rounded-xl bg-gradient-to-br text-white shadow-md transition-transform duration-300 group-hover:scale-110",
              accentMap[accent]
            )}
          >
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
