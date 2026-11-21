import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/app-shell'
import { ErrorBoundary } from './components/error-boundary'
import { queryClient } from './lib/query-client'
import { OverviewPage } from './pages/overview-page'
import { NotFoundPage, PlaceholderPage } from './pages/placeholder-page'

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/app" replace />} />
            <Route element={<AppShell />} path="/app">
              <Route element={<OverviewPage />} index />
              <Route
                element={
                  <PlaceholderPage
                    description="Your uploaded files will appear here."
                    title="Documents"
                  />
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
            <Route element={<NotFoundPage />} path="*" />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
