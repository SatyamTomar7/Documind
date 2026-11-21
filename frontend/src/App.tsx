import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/app-shell'
import { ErrorBoundary } from './components/error-boundary'
import { ProtectedRoute } from './components/protected-route'
import { AuthProvider } from './features/auth/auth-provider'
import { queryClient } from './lib/query-client'
import { LoginPage } from './pages/login-page'
import { DocumentsPage } from './pages/documents-page'
import { OverviewPage } from './pages/overview-page'
import { NotFoundPage, PlaceholderPage } from './pages/placeholder-page'
import { RegisterPage } from './pages/register-page'

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Navigate to="/app" replace />} />
              <Route element={<LoginPage />} path="/login" />
              <Route element={<RegisterPage />} path="/register" />
              <Route element={<ProtectedRoute />}>
                <Route element={<AppShell />} path="/app">
                  <Route element={<OverviewPage />} index />
                  <Route
                    element={
                      <DocumentsPage />
                    }
                    path="documents"
                  />
                  <Route
                    element={
                      <PlaceholderPage
                        description="Your document conversations will appear here."
                        title="Conversations"
                      />
                    }
                    path="conversations"
                  />
                </Route>
              </Route>
              <Route element={<NotFoundPage />} path="*" />
            </Routes>
          </BrowserRouter>
        </QueryClientProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
