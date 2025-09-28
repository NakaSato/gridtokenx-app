import React, { Component, ReactNode } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
  retryCount: number
}

export class DashboardErrorBoundary extends Component<Props, State> {
  private maxRetries = 3

  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo
    })

    // Call the optional error callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Dashboard Error Boundary caught an error:', error, errorInfo)
    }

    // In production, you might want to send this to an error reporting service
    // Example: Sentry.captureException(error, { extra: errorInfo })
  }

  handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1
      }))
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    })
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <Card className="border-destructive">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <CardTitle className="text-destructive">Something went wrong</CardTitle>
            </div>
            <CardDescription>
              An error occurred while loading this section of the dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Error Details */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="destructive" className="text-xs">
                  Error
                </Badge>
                <span className="text-sm font-medium">
                  {this.state.error?.name || 'Unknown Error'}
                </span>
              </div>
              
              <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                {this.state.error?.message || 'An unexpected error occurred'}
              </div>

              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                    Show technical details
                  </summary>
                  <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-32">
                    {this.state.error?.stack}
                    {'\n\nComponent Stack:'}
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2">
              {this.state.retryCount < this.maxRetries && (
                <Button 
                  onClick={this.handleRetry}
                  variant="default"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again ({this.maxRetries - this.state.retryCount} attempts left)
                </Button>
              )}
              
              <Button 
                onClick={this.handleReset}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                Reset Component
              </Button>
              
              <Button 
                onClick={this.handleReload}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Reload Page
              </Button>
            </div>

            {/* Retry Count Warning */}
            {this.state.retryCount >= this.maxRetries && (
              <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <Bug className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">
                    Maximum retry attempts reached
                  </p>
                  <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                    This error persists after multiple attempts. Please try reloading the page or contact support if the issue continues.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )
    }

    return this.props.children
  }
}

// Wrapper component for easier usage with hooks
interface ErrorBoundaryWrapperProps {
  children: ReactNode
  fallback?: ReactNode
  componentName?: string
}

export function ErrorBoundaryWrapper({ 
  children, 
  fallback, 
  componentName = 'Component' 
}: ErrorBoundaryWrapperProps) {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Log error with component context
    console.error(`Error in ${componentName}:`, error, errorInfo)
    
    // In production, send to error reporting service
    // Example: reportError(error, { component: componentName, ...errorInfo })
  }

  return (
    <DashboardErrorBoundary onError={handleError} fallback={fallback}>
      {children}
    </DashboardErrorBoundary>
  )
}

// Specialized error boundary for trading components
export function TradingErrorBoundary({ children }: { children: ReactNode }) {
  const fallback = (
    <Card className="border-destructive">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <CardTitle className="text-destructive">Trading Component Error</CardTitle>
        </div>
        <CardDescription>
          Unable to load trading functionality. This may be due to network issues or blockchain connectivity problems.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">
            Possible causes:
          </div>
          <ul className="text-sm text-muted-foreground space-y-1 ml-4">
            <li>• Network connectivity issues</li>
            <li>• Blockchain RPC endpoint problems</li>
            <li>• Wallet connection errors</li>
            <li>• Smart contract interaction failures</li>
          </ul>
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline" 
            size="sm"
            className="w-full sm:w-auto"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reload Dashboard
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <ErrorBoundaryWrapper fallback={fallback} componentName="Trading Component">
      {children}
    </ErrorBoundaryWrapper>
  )
}

// Network-specific error boundary
export function NetworkErrorBoundary({ children }: { children: ReactNode }) {
  const fallback = (
    <Card className="border-destructive">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <CardTitle className="text-destructive">Network Connection Error</CardTitle>
        </div>
        <CardDescription>
          Unable to connect to the Solana network or fetch blockchain data.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">
            Please check your internet connection and try again.
          </div>
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline" 
            size="sm"
            className="w-full sm:w-auto"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry Connection
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <ErrorBoundaryWrapper fallback={fallback} componentName="Network Component">
      {children}
    </ErrorBoundaryWrapper>
  )
}