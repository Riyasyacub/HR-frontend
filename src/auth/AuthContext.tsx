import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  refreshAccessToken,
  signIn as signInRequest,
  signOut as signOutRequest,
  type AuthSession,
  type User,
} from '../api/auth'

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

type AuthContextValue = {
  status: AuthStatus
  session: AuthSession | null
  signIn: (email: string, password: string) => Promise<User>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')

  useEffect(() => {
    refreshAccessToken()
      .then((next) => {
        setSession(next)
        setStatus('authenticated')
      })
      .catch(() => setStatus('unauthenticated'))
  }, [])

  async function signIn(email: string, password: string) {
    const next = await signInRequest(email, password)
    setSession(next)
    setStatus('authenticated')
    return next.user
  }

  async function signOut() {
    try {
      await signOutRequest()
    } finally {
      setSession(null)
      setStatus('unauthenticated')
    }
  }

  return (
    <AuthContext.Provider value={{ session, status, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
