import { QueryClientProvider } from '@tanstack/react-query'
import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/app-shell'
import { ErrorBoundary } from './components/error-boundary'
import { ProtectedRoute } from './components/protected-route'
import { AuthProvider } from './features/auth/auth-provider'
import { queryClient } from './lib/query-client'

const ConversationsPage = lazy(() =>
  import('./pages/conversations-page').then(({ ConversationsPage: page }) => ({
    default: page,
  })),
)
const DocumentsPage = lazy(() =>
  import('./pages/documents-page').then(({ DocumentsPage: page }) => ({
    default: page,
  })),
)
const LoginPage = lazy(() =>
  import('./pages/login-page').then(({ LoginPage: page }) => ({
    default: page,
  })),
)
const OverviewPage = lazy(() =>
  import('./pages/overview-page').then(({ OverviewPage: page }) => ({
    default: page,
  })),
)
const RegisterPage = lazy(() =>
  import('./pages/register-page').then(({ RegisterPage: page }) => ({
    default: page,
  })),
)
const NotFoundPage = lazy(() =>
  import('./pages/placeholder-page').then(({ NotFoundPage: page }) => ({
    default: page,
  })),
)

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <Suspense
              fallback={
                <div className="flex min-h-screen items-center justify-center bg-slate-950 text-sm text-slate-400">
                  Loading workspace…
                </div>
              }
            >
              <Routes>
                <Route path="/" element={<Navigate to="/app" replace />} />
                <Route element={<LoginPage />} path="/login" />
                <Route element={<RegisterPage />} path="/register" />
                <Route element={<ProtectedRoute />}>
                  <Route element={<AppShell />} path="/app">
                    <Route element={<OverviewPage />} index />
                    <Route element={<DocumentsPage />} path="documents" />
                    <Route element={<ConversationsPage />} path="conversations" />
                  </Route>
                </Route>
                <Route element={<NotFoundPage />} path="*" />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </QueryClientProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
