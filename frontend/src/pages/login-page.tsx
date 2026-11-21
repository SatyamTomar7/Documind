import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useState, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useAuth } from '../features/auth/use-auth'

const loginSchema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type LoginValues = z.infer<typeof loginSchema>

export function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (values: LoginValues) => {
    setSubmitError(null)
    try {
      await signIn(values.email, values.password)
      const from = (location.state as { from?: { pathname?: string } } | null)?.from
      navigate(from?.pathname ?? '/app', { replace: true })
    } catch {
      setSubmitError('Unable to sign in. Check your credentials and try again.')
    }
  }

  return (
    <AuthPageLayout
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link className="font-semibold text-cyan-300 hover:text-cyan-200" to="/register">
            Create one
          </Link>
        </>
      }
      subtitle="Sign in to continue to your document workspace."
      title="Welcome back"
    >
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <FormField error={errors.email?.message} label="Email">
          <input
            autoComplete="email"
            className="auth-input"
            {...register('email')}
          />
        </FormField>
        <FormField error={errors.password?.message} label="Password">
          <input
            autoComplete="current-password"
            className="auth-input"
            type="password"
            {...register('password')}
          />
        </FormField>
        {submitError && <p className="text-sm text-rose-300">{submitError}</p>}
        <button className="auth-button" disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </AuthPageLayout>
  )
}

export function FormField({
  children,
  error,
  label,
}: {
  children: ReactNode
  error?: string
  label: string
}) {
  return (
    <label className="block text-sm font-medium text-slate-200">
      {label}
      <div className="mt-2">{children}</div>
      {error && <p className="mt-2 text-xs text-rose-300">{error}</p>}
    </label>
  )
}

export function AuthPageLayout({
  children,
  footer,
  subtitle,
  title,
}: {
  children: ReactNode
  footer: ReactNode
  subtitle: string
  title: string
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-12 text-slate-100">
      <section className="w-full max-w-md">
        <p className="text-center text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">
          DocuMind
        </p>
        <div className="mt-8 rounded-3xl border border-slate-800 bg-slate-900/70 p-8 shadow-2xl shadow-cyan-950/20">
          <h1 className="text-3xl font-semibold">{title}</h1>
          <p className="mt-2 text-sm text-slate-400">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <p className="mt-6 text-center text-sm text-slate-400">{footer}</p>
        </div>
      </section>
    </main>
  )
}
