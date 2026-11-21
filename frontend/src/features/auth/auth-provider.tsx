import { useMemo, useState, type ReactNode } from 'react'
import { login, register } from './auth.api'
import { AuthContext } from './auth.context'
import { authStorage } from './auth.storage'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState(authStorage.getUser)

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user && authStorage.getAccessToken()),
      signIn: async (email: string, password: string) => {
        const auth = await login(email, password)
        authStorage.save(auth)
        setUser(auth.user)
      },
      signUp: async (name: string, email: string, password: string) => {
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
