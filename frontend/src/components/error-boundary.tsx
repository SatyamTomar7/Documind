import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { hasError: boolean }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Frontend error boundary captured an error', {
      error,
      errorInfo,
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-center text-slate-100">
          <section className="max-w-md">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-400">
              Something went wrong
            </p>
            <h1 className="mt-4 text-3xl font-semibold">This view crashed</h1>
            <p className="mt-4 text-slate-400">
              Refresh the page to try again. Your documents are safe.
            </p>
            <button
              className="mt-8 rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-300"
              onClick={() => window.location.reload()}
              type="button"
            >
              Refresh page
            </button>
          </section>
        </main>
      )
    }

    return this.props.children
  }
}
