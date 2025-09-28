import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

// Base skeleton component with consistent styling
export function BaseSkeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

// Generic loading card for any dashboard component
interface LoadingCardProps {
  title?: string
  icon?: React.ComponentType<any>
  className?: string
  children?: React.ReactNode
}

export function LoadingCard({ title, icon: Icon, className, children }: LoadingCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {Icon && <Icon className="h-5 w-5" />}
          {title || <BaseSkeleton className="h-5 w-32" />}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {children || (
          <div className="space-y-4">
            <BaseSkeleton className="h-4 w-3/4" />
            <BaseSkeleton className="h-32 w-full" />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Trading section loading skeleton
export function TradingSectionSkeleton() {
  return (
    <LoadingCard title="Trading Opportunities">
      <div className="space-y-6">
        {/* Live prices skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <BaseSkeleton className="h-4 w-16 mx-auto" />
              <BaseSkeleton className="h-6 w-20 mx-auto" />
              <BaseSkeleton className="h-3 w-12 mx-auto" />
            </div>
          ))}
        </div>

        {/* Filters skeleton */}
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <BaseSkeleton className="h-6 w-24" />
            {Array.from({ length: 4 }).map((_, i) => (
              <BaseSkeleton key={i} className="h-8 w-16" />
            ))}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <BaseSkeleton className="h-4 w-20" />
                <BaseSkeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Opportunities list skeleton */}
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border-l-4 border-l-muted">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-center">
                  <div className="space-y-2">
                    <BaseSkeleton className="h-6 w-16" />
                    <BaseSkeleton className="h-4 w-24" />
                    <BaseSkeleton className="h-4 w-32" />
                  </div>
                  <div className="space-y-1">
                    <BaseSkeleton className="h-4 w-16" />
                    <BaseSkeleton className="h-6 w-20" />
                    <BaseSkeleton className="h-5 w-24" />
                  </div>
                  <div className="space-y-1">
                    <BaseSkeleton className="h-4 w-20" />
                    <BaseSkeleton className="h-5 w-16" />
                    <BaseSkeleton className="h-4 w-24" />
                  </div>
                  <div className="space-y-3">
                    <BaseSkeleton className="h-4 w-20" />
                    <BaseSkeleton className="h-10 w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </LoadingCard>
  )
}

// Market overview loading skeleton
export function MarketOverviewSkeleton() {
  return (
    <div className="space-y-6">
      {/* Market metrics skeleton */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BaseSkeleton className="h-5 w-5" />
            Market Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <BaseSkeleton className="h-4 w-20" />
                <BaseSkeleton className="h-6 w-16" />
                <BaseSkeleton className="h-3 w-12" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Price chart skeleton */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <BaseSkeleton className="h-5 w-5" />
              Price Charts
            </CardTitle>
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <BaseSkeleton key={i} className="h-8 w-12" />
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tabs skeleton */}
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <BaseSkeleton key={i} className="h-10 w-full" />
            ))}
          </div>

          {/* Market stats skeleton */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <BaseSkeleton className="h-4 w-20" />
                <BaseSkeleton className="h-5 w-16" />
              </div>
            ))}
          </div>

          {/* Chart skeleton */}
          <BaseSkeleton className="h-64 sm:h-80 w-full" />
        </CardContent>
      </Card>
    </div>
  )
}

// Transaction history loading skeleton
export function TransactionHistorySkeleton() {
  return (
    <LoadingCard title="Transaction History">
      <div className="space-y-4">
        {/* Search and filters skeleton */}
        <div className="space-y-4">
          <BaseSkeleton className="h-10 w-full" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <BaseSkeleton key={i} className="h-8 w-20" />
            ))}
          </div>
        </div>

        {/* Table skeleton */}
        <div className="rounded-md border">
          <div className="p-4">
            {/* Table header */}
            <div className="grid grid-cols-9 gap-4 pb-3 border-b">
              {Array.from({ length: 9 }).map((_, i) => (
                <BaseSkeleton key={i} className="h-4 w-full" />
              ))}
            </div>
            
            {/* Table rows */}
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="grid grid-cols-9 gap-4 py-3 border-b last:border-b-0">
                {Array.from({ length: 9 }).map((_, j) => (
                  <BaseSkeleton key={j} className="h-4 w-full" />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Pagination skeleton */}
        <div className="flex items-center justify-between">
          <BaseSkeleton className="h-4 w-48" />
          <div className="flex items-center gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <BaseSkeleton key={i} className="h-8 w-8" />
            ))}
          </div>
        </div>
      </div>
    </LoadingCard>
  )
}

// Token portfolio loading skeleton
export function TokenPortfolioSkeleton() {
  return (
    <LoadingCard title="Token Portfolio">
      <div className="space-y-4">
        {/* Portfolio summary */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="space-y-2">
            <BaseSkeleton className="h-4 w-20" />
            <BaseSkeleton className="h-6 w-24" />
          </div>
          <div className="space-y-2">
            <BaseSkeleton className="h-4 w-16" />
            <BaseSkeleton className="h-6 w-20" />
          </div>
        </div>

        {/* Token list */}
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <BaseSkeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-1">
                  <BaseSkeleton className="h-4 w-16" />
                  <BaseSkeleton className="h-3 w-12" />
                </div>
              </div>
              <div className="text-right space-y-1">
                <BaseSkeleton className="h-4 w-20" />
                <BaseSkeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </LoadingCard>
  )
}

// Network status loading skeleton
export function NetworkStatusSkeleton() {
  return (
    <LoadingCard title="Network Status">
      <div className="space-y-4">
        {/* Network info grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <BaseSkeleton className="h-4 w-20" />
              <BaseSkeleton className="h-6 w-16" />
            </div>
          ))}
        </div>

        {/* Network health indicator */}
        <div className="p-4 border rounded-lg">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <BaseSkeleton className="h-4 w-24" />
              <BaseSkeleton className="h-3 w-32" />
            </div>
            <BaseSkeleton className="h-6 w-16" />
          </div>
        </div>

        {/* Recent blocks */}
        <div className="space-y-3">
          <BaseSkeleton className="h-5 w-24" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-2 bg-muted rounded">
              <BaseSkeleton className="h-4 w-32" />
              <BaseSkeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    </LoadingCard>
  )
}

// Portfolio metrics loading skeleton
export function PortfolioMetricsSkeleton() {
  return (
    <LoadingCard title="Portfolio Metrics">
      <div className="space-y-4">
        {/* Total value */}
        <div className="text-center space-y-2">
          <BaseSkeleton className="h-4 w-20 mx-auto" />
          <BaseSkeleton className="h-8 w-32 mx-auto" />
          <BaseSkeleton className="h-4 w-24 mx-auto" />
        </div>

        {/* Chart placeholder */}
        <BaseSkeleton className="h-48 w-full" />

        {/* Metrics grid */}
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <BaseSkeleton className="h-4 w-16" />
              <BaseSkeleton className="h-5 w-20" />
            </div>
          ))}
        </div>
      </div>
    </LoadingCard>
  )
}

// Quick stats loading skeleton
export function QuickStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <BaseSkeleton className="h-4 w-24" />
                <BaseSkeleton className="h-8 w-16" />
                <BaseSkeleton className="h-3 w-20" />
              </div>
              <BaseSkeleton className="h-8 w-8" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}