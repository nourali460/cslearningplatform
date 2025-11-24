'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { GraduationCap } from 'lucide-react'

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim()
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 403 && data.needsApproval) {
          setError('Your professor account is pending admin approval. Please wait for approval before signing in.')
        } else {
          setError(data.error || 'Invalid email or password')
        }
        setIsLoading(false)
        return
      }

      // Login successful - redirect based on role
      const userRole = data.user.role
      if (userRole === 'admin') {
        router.push('/admin')
      } else if (userRole === 'professor') {
        router.push('/professor')
      } else if (userRole === 'student') {
        router.push('/student')
      } else {
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('An unexpected error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f8f9fa 0%, #e9ecef 100%)' }}>
      {/* Header */}
      <nav className="navbar navbar-light bg-white border-bottom shadow-sm">
        <div className="container">
          <Link href="/" className="navbar-brand d-flex align-items-center">
            <GraduationCap className="me-2" size={24} style={{ color: 'var(--primary-blue)' }} />
            <span className="fw-bold">CS Learning Platform</span>
          </Link>
          <Link href="/" className="btn btn-outline-primary">
            Back to Home
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-5">
            {/* Page Title */}
            <div className="text-center mb-4">
              <h1 className="display-5 fw-bold text-dark mb-2">Sign In</h1>
              <p className="lead text-muted">Enter your credentials to continue</p>
            </div>

            {/* Sign In Card */}
            <div className="card shadow-lg border-0">
              <div className="card-header text-white text-center py-3" style={{ backgroundColor: 'var(--primary-blue)' }}>
                <h5 className="card-title mb-0 fw-bold">Welcome Back</h5>
                <p className="mb-0 small opacity-90">Sign in to access your account</p>
              </div>
              <div className="card-body p-4">
                <form onSubmit={handleSubmit}>
                  {/* Email Field */}
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label fw-semibold">Email</label>
                    <input
                      id="email"
                      type="email"
                      className="form-control form-control-lg"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>

                  {/* Password Field */}
                  <div className="mb-3">
                    <label htmlFor="password" className="form-label fw-semibold">Password</label>
                    <input
                      id="password"
                      type="password"
                      className="form-control form-control-lg"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                    />
                  </div>

                  {/* Error Alert */}
                  {error && (
                    <div className="alert alert-danger d-flex align-items-center" role="alert">
                      <svg className="bi flex-shrink-0 me-2" width="24" height="24" role="img" aria-label="Danger:">
                        <use xlinkHref="#exclamation-triangle-fill"/>
                      </svg>
                      <div>{error}</div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg w-100 fw-semibold"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Signing in...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </button>
                </form>

                {/* Sign Up Link */}
                <div className="text-center mt-4">
                  <p className="text-muted mb-0">
                    Don't have an account?{' '}
                    <Link href="/sign-up" className="text-decoration-none fw-semibold" style={{ color: 'var(--primary-blue)' }}>
                      Sign up here
                    </Link>
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Note */}
            <div className="text-center mt-4">
              <p className="text-muted small">
                Note: Forgot your password? Contact your system administrator for a password reset.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bootstrap Icons for Alert */}
      <svg xmlns="http://www.w3.org/2000/svg" style={{ display: 'none' }}>
        <symbol id="exclamation-triangle-fill" fill="currentColor" viewBox="0 0 16 16">
          <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
        </symbol>
      </svg>
    </div>
  )
}
