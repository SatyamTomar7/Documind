import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { queryClient } from './lib/query-client'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/app" replace />} />
          <Route
            path="/app"
            element={
              <main className="min-h-screen bg-slate-950 text-slate-100">
                <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6">
                  <section className="max-w-xl text-center">
                    <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">
                      DocuMind
                    </p>
                    <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
                      Your documents, understood.
                    </h1>
                    <p className="mt-6 text-lg leading-8 text-slate-400">
                      The workspace foundation is ready. Authentication and
                      document workflows are coming next.
                    </p>
                  </section>
                </div>
              </main>
            }
          />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
