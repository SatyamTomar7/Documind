import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useAuth } from '../features/auth/use-auth'
import { AuthPageLayout, FormField } from './login-page'

const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
    email: z.email('Enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type RegisterValues = z.infer<typeof registerSchema>

export function RegisterPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) })

  const onSubmit = async (values: RegisterValues) => {
    setSubmitError(null)
    try {
      await signUp(values.name, values.email, values.password)
      navigate('/app', { replace: true })
    } catch {
      setSubmitError('Unable to create your account. Please try again.')
    }
  }

  return (
    <AuthPageLayout
      footer={
        <>
          Already have an account?{' '}
          <Link className="font-semibold text-cyan-300 hover:text-cyan-200" to="/login">
            Sign in
          </Link>
        </>
      }
      subtitle="Create an account to start working with your documents."
      title="Create your account"
    >
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <FormField error={errors.name?.message} label="Name">
          <input autoComplete="name" className="auth-input" {...register('name')} />
        </FormField>
        <FormField error={errors.email?.message} label="Email">
          <input autoComplete="email" className="auth-input" {...register('email')} />
        </FormField>
        <FormField error={errors.password?.message} label="Password">
          <input
            autoComplete="new-password"
            className="auth-input"
            type="password"
            {...register('password')}
          />
        </FormField>
        <FormField error={errors.confirmPassword?.message} label="Confirm password">
          <input
            autoComplete="new-password"
            className="auth-input"
            type="password"
            {...register('confirmPassword')}
          />
        </FormField>
        {submitError && <p className="text-sm text-rose-300">{submitError}</p>}
        <button className="auth-button" disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </AuthPageLayout>
  )
}
