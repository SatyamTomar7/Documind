import { FileText, LayoutDashboard, Menu, MessageSquare, X } from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'

const navigation = [
  { label: 'Overview', to: '/app', icon: LayoutDashboard, end: true },
  { label: 'Documents', to: '/app/documents', icon: FileText, end: false },
  {
    label: 'Conversations',
    to: '/app/conversations',
    icon: MessageSquare,
    end: false,
  },
]

export function AppShell() {
  const [isSidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {isSidebarOpen && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-slate-950/70 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          type="button"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-800 bg-slate-950 px-5 py-6 transition-transform lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">
              DocuMind
            </p>
            <p className="mt-2 text-xs text-slate-500">Document intelligence</p>
          </div>
          <button
            aria-label="Close navigation"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
            onClick={() => setSidebarOpen(false)}
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        <nav aria-label="Main navigation" className="mt-10 space-y-2">
          {navigation.map(({ label, to, icon: Icon, end }) => (
            <NavLink
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? 'bg-cyan-400/10 text-cyan-300'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'
                }`
              }
              end={end}
              key={to}
              onClick={() => setSidebarOpen(false)}
              to={to}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-sm font-medium text-slate-200">Ready to explore?</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Upload a document to start asking grounded questions.
          </p>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-slate-950/90 px-6 py-4 backdrop-blur lg:px-10">
          <button
            aria-label="Open navigation"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
            onClick={() => setSidebarOpen(true)}
            type="button"
          >
            <Menu size={22} />
          </button>
        </header>
        <main className="px-6 py-8 lg:px-10">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
