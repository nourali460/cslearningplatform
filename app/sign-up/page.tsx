'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { GraduationCap, Users, ArrowLeft, CheckCircle, Copy } from 'lucide-react'

type Role = 'student' | 'professor' | null

export default function SignUpPage() {
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState<Role>(null)
  const [step, setStep] = useState<'role' | 'classCode' | 'register' | 'success'>('role')

  // Form fields
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [usernameSchoolId, setUsernameSchoolId] = useState('')
  const [classCode, setClassCode] = useState('')

  // UI state
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [generatedPassword, setGeneratedPassword] = useState('')
  const [copiedPassword, setCopiedPassword] = useState(false)

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role)
    if (role === 'student') {
      setStep('classCode')
    } else if (role === 'professor') {
      setStep('register')
    }
  }

  const handleClassCodeContinue = async () => {
    if (!classCode.trim()) {
      setError('Please enter a class code')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Validate the class code
      const response = await fetch('/api/validate-class-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classCode: classCode.trim().toUpperCase() }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Invalid class code')
        setIsLoading(false)
        return
      }

      // Class code valid - proceed to registration
      setStep('register')
      setIsLoading(false)
    } catch (error) {
      setError('Failed to validate class code. Please try again.')
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    // Validation
    if (!usernameSchoolId.trim()) {
      setError('School ID is required')
      setIsLoading(false)
      return
    }

    const schoolIdNum = parseInt(usernameSchoolId.trim(), 10)
    if (isNaN(schoolIdNum) || schoolIdNum < 0 || schoolIdNum > 1000000) {
      setError('School ID must be a number between 0 and 1000000')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          fullName: fullName.trim(),
          role: selectedRole,
          usernameSchoolId: usernameSchoolId.trim(),
          classCode: selectedRole === 'student' ? classCode.trim().toUpperCase() : undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Registration failed')
        setIsLoading(false)
        return
      }

      // Success! Show the generated password
      setGeneratedPassword(data.user.password)
      setStep('success')
      setIsLoading(false)
    } catch (error) {
      console.error('Registration error:', error)
      setError('An unexpected error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(generatedPassword)
    setCopiedPassword(true)
    setTimeout(() => setCopiedPassword(false), 2000)
  }

  const handleContinueToSignIn = () => {
    router.push('/sign-in')
  }

  // Success screen
  if (step === 'success') {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f8f9fa 0%, #e9ecef 100%)' }}>
        <nav className="navbar navbar-light bg-white border-bottom shadow-sm">
          <div className="container">
            <Link href="/" className="navbar-brand d-flex align-items-center">
              <GraduationCap className="me-2" size={24} style={{ color: 'var(--primary-blue)' }} />
              <span className="fw-bold">CS Learning Platform</span>
            </Link>
          </div>
        </nav>

        <div className="container py-5">
          <div className="row justify-content-center">
            <div className="col-12 col-md-8 col-lg-5">
              <div className="card shadow-lg border-0">
                <div className="card-header text-white text-center py-4" style={{ backgroundColor: 'var(--primary-blue)' }}>
                  <div className="d-flex justify-content-center mb-3">
                    <div className="rounded-circle bg-white p-3">
                      <CheckCircle size={48} style={{ color: 'var(--primary-blue)' }} />
                    </div>
                  </div>
                  <h5 className="card-title mb-2 fw-bold">Account Created Successfully!</h5>
                  <p className="mb-0 small opacity-90">
                    {selectedRole === 'professor'
                      ? 'Your professor account is pending admin approval.'
                      : 'Your account has been created. Save your password to sign in.'}
                  </p>
                </div>
                <div className="card-body p-4">
                  {/* Generated Password */}
                  <div className="bg-light rounded p-4 mb-3">
                    <label className="form-label small text-muted">Your Generated Password</label>
                    <div className="d-flex align-items-center justify-content-between gap-3">
                      <code className="fs-4 fw-bold text-primary" style={{ letterSpacing: '0.1em' }}>
                        {generatedPassword}
                      </code>
                      <button
                        className={`btn ${copiedPassword ? 'btn-success' : 'btn-outline-primary'} btn-sm`}
                        onClick={handleCopyPassword}
                      >
                        {copiedPassword ? (
                          <>
                            <CheckCircle className="me-1" size={16} />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="me-1" size={16} />
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Warning Alert */}
                  <div className="alert alert-warning d-flex align-items-start" role="alert">
                    <svg className="bi flex-shrink-0 me-2" width="24" height="24" role="img">
                      <use xlinkHref="#exclamation-triangle-fill"/>
                    </svg>
                    <div>
                      <strong>Important:</strong> Save this password now! You'll need it to sign in.
                    </div>
                  </div>

                  {/* Account Details */}
                  <div className="mb-4">
                    <p className="small text-muted mb-2">
                      <strong>Email:</strong> {email}
                    </p>
                    <p className="small text-muted mb-2">
                      <strong>Role:</strong> {selectedRole === 'professor' ? 'Professor' : 'Student'}
                    </p>
                    <p className="small text-muted mb-0">
                      <strong>School ID:</strong> {usernameSchoolId}
                    </p>
                  </div>

                  {/* Continue Button */}
                  <button
                    className="btn btn-primary btn-lg w-100 fw-semibold"
                    onClick={handleContinueToSignIn}
                    disabled={selectedRole === 'professor'}
                  >
                    {selectedRole === 'professor' ? 'Awaiting Admin Approval' : 'Continue to Sign In'}
                  </button>

                  {selectedRole === 'professor' && (
                    <p className="text-center text-muted small mt-3 mb-0">
                      You'll receive a notification once your account is approved by an administrator.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
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
          <div className="col-12 col-lg-10">
            {/* Page Title */}
            <div className="text-center mb-5">
              <h1 className="display-5 fw-bold text-dark mb-2">Create Your Account</h1>
              <p className="lead text-muted">
                {step === 'role' && 'Select your role to get started'}
                {step === 'classCode' && 'Enter your class code to continue'}
                {step === 'register' && 'Complete your registration'}
              </p>
            </div>

            {/* Role Selection */}
            {step === 'role' && (
              <div className="row g-4 justify-content-center">
                <div className="col-12 col-md-6 col-lg-5">
                  <div
                    className="card h-100 shadow-sm border-primary"
                    style={{ cursor: 'pointer', transition: 'all 0.3s' }}
                    onClick={() => handleRoleSelect('student')}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-5px)'
                      e.currentTarget.style.boxShadow = '0 0.5rem 1rem rgba(0,0,0,0.15)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = ''
                    }}
                  >
                    <div className="card-body text-center p-4">
                      <div className="d-flex justify-content-center mb-4">
                        <div className="rounded-circle p-4" style={{ backgroundColor: '#cfe2ff' }}>
                          <GraduationCap size={48} style={{ color: 'var(--primary-blue)' }} />
                        </div>
                      </div>
                      <h5 className="card-title fw-bold mb-2">Student</h5>
                      <p className="text-muted mb-4">Join a class with a class code</p>
                      <button
                        className="btn btn-primary w-100 mb-2"
                        onClick={() => handleRoleSelect('student')}
                      >
                        Sign Up as Student
                      </button>
                      <p className="text-muted small mb-0">
                        Requires class code from professor
                      </p>
                    </div>
                  </div>
                </div>

                <div className="col-12 col-md-6 col-lg-5">
                  <div
                    className="card h-100 shadow-sm border-success"
                    style={{ cursor: 'pointer', transition: 'all 0.3s' }}
                    onClick={() => handleRoleSelect('professor')}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-5px)'
                      e.currentTarget.style.boxShadow = '0 0.5rem 1rem rgba(0,0,0,0.15)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = ''
                    }}
                  >
                    <div className="card-body text-center p-4">
                      <div className="d-flex justify-content-center mb-4">
                        <div className="rounded-circle p-4" style={{ backgroundColor: '#d1e7dd' }}>
                          <Users size={48} style={{ color: '#198754' }} />
                        </div>
                      </div>
                      <h5 className="card-title fw-bold mb-2">Professor</h5>
                      <p className="text-muted mb-4">Create classes and grade student work</p>
                      <button
                        className="btn btn-success w-100 mb-2"
                        onClick={() => handleRoleSelect('professor')}
                      >
                        Sign Up as Professor
                      </button>
                      <p className="text-muted small mb-0">
                        Requires admin approval
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Class Code Input (Students) */}
            {step === 'classCode' && (
              <div className="row justify-content-center">
                <div className="col-12 col-md-8 col-lg-6">
                  <div className="card shadow-lg border-0">
                    <div className="card-header text-white text-center py-4" style={{ backgroundColor: 'var(--primary-blue)' }}>
                      <div className="d-flex justify-content-center mb-3">
                        <div className="rounded-circle bg-white p-3">
                          <GraduationCap size={40} style={{ color: 'var(--primary-blue)' }} />
                        </div>
                      </div>
                      <h5 className="card-title mb-2 fw-bold">Student Sign Up</h5>
                      <p className="mb-0 small opacity-90">Enter the class code provided by your professor</p>
                    </div>
                    <div className="card-body p-4">
                      <div className="mb-4">
                        <label htmlFor="classCode" className="form-label fw-semibold">Class Code</label>
                        <input
                          id="classCode"
                          type="text"
                          className="form-control form-control-lg text-center"
                          style={{ fontFamily: 'monospace', fontSize: '1.25rem', letterSpacing: '0.05em' }}
                          placeholder="e.g., ALI-CS101-FA25-01"
                          value={classCode}
                          onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                          onKeyDown={(e) => e.key === 'Enter' && handleClassCodeContinue()}
                        />
                        {error && (
                          <div className="alert alert-danger mt-3 mb-0" role="alert">
                            {error}
                          </div>
                        )}
                      </div>
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-outline-secondary w-50"
                          onClick={() => {
                            setStep('role')
                            setSelectedRole(null)
                            setClassCode('')
                            setError(null)
                          }}
                        >
                          <ArrowLeft className="me-2" size={16} />
                          Back
                        </button>
                        <button
                          className="btn btn-primary w-50"
                          onClick={handleClassCodeContinue}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                              Validating...
                            </>
                          ) : (
                            'Continue'
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Registration Form */}
            {step === 'register' && (
              <div className="row justify-content-center">
                <div className="col-12 col-md-8 col-lg-6">
                  <div className="card shadow-lg border-0">
                    <div className="card-header text-white text-center py-3" style={{ backgroundColor: 'var(--primary-blue)' }}>
                      <h5 className="card-title mb-1 fw-bold">Complete Your Registration</h5>
                      <p className="mb-0 small opacity-90">
                        {selectedRole === 'professor' ? 'Create your professor account' : 'Create your student account'}
                      </p>
                    </div>
                    <div className="card-body p-4">
                      <form onSubmit={handleRegister}>
                        {/* Full Name */}
                        <div className="mb-3">
                          <label htmlFor="fullName" className="form-label fw-semibold">Full Name</label>
                          <input
                            id="fullName"
                            type="text"
                            className="form-control form-control-lg"
                            placeholder="John Doe"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                          />
                        </div>

                        {/* Email */}
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

                        {/* School ID */}
                        <div className="mb-3">
                          <label htmlFor="usernameSchoolId" className="form-label fw-semibold">School ID</label>
                          <input
                            id="usernameSchoolId"
                            type="number"
                            className="form-control form-control-lg"
                            placeholder="Enter your school ID (0-1000000)"
                            value={usernameSchoolId}
                            onChange={(e) => setUsernameSchoolId(e.target.value)}
                            required
                            min="0"
                            max="1000000"
                          />
                          <div className="form-text">
                            {selectedRole === 'professor'
                              ? 'Your school ID will be used in class codes'
                              : 'Enter your student school ID number'}
                          </div>
                        </div>

                        {/* Error Alert */}
                        {error && (
                          <div className="alert alert-danger" role="alert">
                            {error}
                          </div>
                        )}

                        {/* Info Alert */}
                        <div className="alert alert-info" role="alert">
                          <small>
                            A unique 6-character password will be generated for you upon registration.
                          </small>
                        </div>

                        {/* Buttons */}
                        <div className="d-flex gap-2">
                          <button
                            type="button"
                            className="btn btn-outline-secondary w-50"
                            onClick={() => {
                              if (selectedRole === 'student') {
                                setStep('classCode')
                              } else {
                                setStep('role')
                                setSelectedRole(null)
                              }
                              setError(null)
                            }}
                          >
                            <ArrowLeft className="me-2" size={16} />
                            Back
                          </button>
                          <button
                            type="submit"
                            className="btn btn-primary w-50"
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                Creating...
                              </>
                            ) : (
                              'Create Account'
                            )}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sign In Link */}
            <div className="text-center mt-5">
              <p className="text-muted">
                Already have an account?{' '}
                <Link href="/sign-in" className="text-decoration-none fw-semibold" style={{ color: 'var(--primary-blue)' }}>
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bootstrap Icons */}
      <svg xmlns="http://www.w3.org/2000/svg" style={{ display: 'none' }}>
        <symbol id="exclamation-triangle-fill" fill="currentColor" viewBox="0 0 16 16">
          <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
        </symbol>
      </svg>
    </div>
  )
}
