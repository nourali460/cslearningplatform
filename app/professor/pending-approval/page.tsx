import { Clock, Mail, CheckCircle, GraduationCap } from 'lucide-react'
import Link from 'next/link'
import { getProfessorUnapproved } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { LogoutButton } from '@/components/logout-button'

export default async function PendingApprovalPage() {
  const professor = await getProfessorUnapproved()

  if (!professor) {
    redirect('/sign-in')
  }

  // If already approved, redirect to professor dashboard
  if (professor.isApproved) {
    redirect('/professor')
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
          <div>
            <LogoutButton />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-12 col-md-10 col-lg-8">
            <div className="card shadow-lg border-0">
              <div className="card-header bg-danger text-white py-4">
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-3">
                    <Clock size={32} />
                    <div>
                      <h5 className="card-title mb-1 fw-bold">Account Inactive</h5>
                      <p className="mb-0 small">Your professor account has been deactivated</p>
                    </div>
                  </div>
                  <span className="badge bg-white text-danger border border-white">Inactive</span>
                </div>
              </div>
              <div className="card-body p-4">
                {/* What happens next */}
                <div className="bg-light rounded p-4 mb-4">
                  <h6 className="fw-bold mb-3">Why is my account inactive?</h6>
                  <ul className="list-unstyled mb-0">
                    <li className="d-flex align-items-start mb-3">
                      <CheckCircle size={18} className="text-muted me-2 mt-1 flex-shrink-0" />
                      <span className="small">Your account has been temporarily deactivated by an administrator</span>
                    </li>
                    <li className="d-flex align-items-start mb-3">
                      <CheckCircle size={18} className="text-muted me-2 mt-1 flex-shrink-0" />
                      <span className="small">Contact your administrator for more information</span>
                    </li>
                    <li className="d-flex align-items-start">
                      <CheckCircle size={18} className="text-muted me-2 mt-1 flex-shrink-0" />
                      <span className="small">Once reactivated, you'll regain full access to your classes and students</span>
                    </li>
                  </ul>
                </div>

                {/* Account Details */}
                <div className="border-start border-4 border-primary bg-primary bg-opacity-10 rounded p-4 mb-4">
                  <div className="d-flex align-items-start gap-3">
                    <Mail size={20} className="text-primary mt-1 flex-shrink-0" />
                    <div>
                      <p className="fw-bold text-primary mb-2">Account Details</p>
                      <p className="mb-1 small">
                        <strong>Email:</strong> {professor.email}
                      </p>
                      <p className="mb-1 small">
                        <strong>Name:</strong> {professor.fullName || 'Not provided'}
                      </p>
                      <p className="mb-0 small">
                        <strong>School ID:</strong> {professor.usernameSchoolId || 'Not set'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Next Steps */}
                <div className="mb-4">
                  <p className="fw-semibold small mb-2">What should I do?</p>
                  <ul className="small text-muted">
                    <li>Contact your system administrator for assistance</li>
                    <li>Ask about the reason for deactivation</li>
                    <li>Request reactivation if this was done in error</li>
                  </ul>
                </div>

                {/* Action Buttons */}
                <div className="d-flex gap-2 mb-3">
                  <Link href="/" className="btn btn-outline-primary w-50">
                    Return to Home
                  </Link>
                  <button
                    onClick={() => window.location.reload()}
                    className="btn btn-danger w-50"
                  >
                    Check Status
                  </button>
                </div>

                {/* Support */}
                <div className="text-center">
                  <p className="text-muted small mb-0">
                    Need help? Contact your administrator or support at support@cslearning.edu
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
