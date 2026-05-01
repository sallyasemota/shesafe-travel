import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  fallback: ReactNode
  children: ReactNode
}

interface State {
  hasError: boolean
}

// Local boundary so a thrown render error in a single subtree (the demo's
// traveler view, etc.) doesn't bubble up to React Router's errorElement
// and replace the whole page with the 404.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (typeof console !== 'undefined') {
      console.error('ErrorBoundary caught:', error, info)
    }
  }

  render() {
    if (this.state.hasError) return this.props.fallback
    return this.props.children
  }
}
