import { createContext, useMemo, useState, type ReactNode } from 'react'
import { login, register } from './auth.api'
import { authStorage } from './auth.storage'
import type { User } from './auth.types'

type AuthContextValue = {
  user: User | null
  isAuthenticated: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (name: string, email: string, password: string) => Promise<void>
  signOut: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(authStorage.getUser)

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user && authStorage.getAccessToken()),
      signIn: async (email, password) => {
        const auth = await login(email, password)
        authStorage.save(auth)
        setUser(auth.user)
      },
      signUp: async (name, email, password) => {
        await register(name, email, password)
        const auth = await login(email, password)
        authStorage.save(auth)
        setUser(auth.user)
      },
      signOut: () => {
        authStorage.clear()
        setUser(null)
      },
    }),
    [user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
