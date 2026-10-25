import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { ApiClientError } from '../api/auth'
import { useAuth } from '../auth/AuthContext'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'

export default function SignInPage() {
  const { signIn, status } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (status === 'loading') return <p className="p-6">Loading…</p>
  if (status === 'authenticated') return <Navigate to="/dashboard" replace />

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    try {
      await signIn(email, password)
    } catch (cause) {
      setError(cause instanceof ApiClientError ? cause.message : 'Unable to sign in')
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-6">
      <form className="w-full max-w-sm space-y-4 rounded-xl border bg-background p-6 shadow-sm" onSubmit={handleSubmit}>
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <label htmlFor="email" className="text-sm font-medium">Email</label>
        <Input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        <label htmlFor="password" className="text-sm font-medium">Password</label>
        <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" className="w-full">Sign in</Button>
      </form>
    </main>
  )
}
