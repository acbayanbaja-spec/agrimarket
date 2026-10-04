import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('AgriMarket application caught an error:', error, errorInfo)
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined })
    window.location.href = '/'
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-primary-50/30 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-soft p-8 text-center border border-gray-100 animate-fade-up">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-5 shadow-sm">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Notice</h1>
            <p className="text-gray-600 text-sm mb-6 leading-relaxed">
              We encountered a temporary rendering issue, but all your harvests, orders, and cart items remain safely saved and synced.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="btn-primary flex-1 inline-flex items-center justify-center gap-2 py-3"
              >
                <RefreshCw className="h-4 w-4" /> Reload page
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                className="btn-outline flex-1 inline-flex items-center justify-center gap-2 py-3"
              >
                <Home className="h-4 w-4" /> Go to home
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
