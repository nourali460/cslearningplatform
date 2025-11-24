import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { BookOpen, Users, GraduationCap, CheckCircle } from "lucide-react";

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--background)' }}>
      {/* Header */}
      <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom shadow-sm">
        <div className="container">
          <Link href="/" className="navbar-brand d-flex align-items-center">
            <GraduationCap className="me-2" size={28} style={{ color: 'var(--primary-blue)' }} />
            <span className="fw-bold">CS Learning Platform</span>
          </Link>
          <div className="d-flex gap-2">
            {user ? (
              <Link href="/dashboard" className="btn btn-primary">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link href="/sign-in" className="btn btn-outline-primary">
                  Sign In
                </Link>
                <Link href="/sign-up" className="btn btn-primary">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-5" style={{ background: 'linear-gradient(180deg, #f8f9fa 0%, #e9ecef 100%)' }}>
        <div className="container text-center py-5">
          <h1 className="display-3 fw-bold mb-4">
            Master Computer Science
            <span className="d-block text-primary mt-2">One Course at a Time</span>
          </h1>
          <p className="lead text-muted mx-auto mb-4" style={{ maxWidth: '700px' }}>
            A comprehensive learning platform designed for computer science students and educators.
            Track your progress, submit assignments, and excel in your courses.
          </p>
          <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center mt-5">
            <Link href="/sign-up" className="btn btn-primary btn-lg px-5">
              Start Learning Free
            </Link>
            <Link href="/sign-in" className="btn btn-outline-primary btn-lg px-5">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-5 my-5">
        <div className="container">
          <h2 className="text-center fw-bold mb-5 display-5">
            Everything You Need to Succeed
          </h2>
          <div className="row g-4">
            {/* Student Card */}
            <div className="col-md-6 col-lg-4">
              <div className="card h-100 shadow-sm">
                <div className="card-body">
                  <div className="mb-3">
                    <BookOpen size={40} style={{ color: 'var(--primary-blue)' }} />
                  </div>
                  <h5 className="card-title fw-bold">For Students</h5>
                  <p className="text-muted mb-3">Access all your courses in one place</p>
                  <ul className="list-unstyled">
                    <li className="d-flex align-items-start mb-2">
                      <CheckCircle size={16} className="text-success me-2 mt-1 flex-shrink-0" />
                      <span className="small">Enroll in classes with a simple class code</span>
                    </li>
                    <li className="d-flex align-items-start mb-2">
                      <CheckCircle size={16} className="text-success me-2 mt-1 flex-shrink-0" />
                      <span className="small">Submit assignments and track grades</span>
                    </li>
                    <li className="d-flex align-items-start mb-2">
                      <CheckCircle size={16} className="text-success me-2 mt-1 flex-shrink-0" />
                      <span className="small">View upcoming assessments and deadlines</span>
                    </li>
                    <li className="d-flex align-items-start">
                      <CheckCircle size={16} className="text-success me-2 mt-1 flex-shrink-0" />
                      <span className="small">Monitor your academic progress</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Professor Card */}
            <div className="col-md-6 col-lg-4">
              <div className="card h-100 shadow-sm">
                <div className="card-body">
                  <div className="mb-3">
                    <Users size={40} style={{ color: 'var(--primary-blue)' }} />
                  </div>
                  <h5 className="card-title fw-bold">For Professors</h5>
                  <p className="text-muted mb-3">Manage your classes efficiently</p>
                  <ul className="list-unstyled">
                    <li className="d-flex align-items-start mb-2">
                      <CheckCircle size={16} className="text-success me-2 mt-1 flex-shrink-0" />
                      <span className="small">Create and manage class sections</span>
                    </li>
                    <li className="d-flex align-items-start mb-2">
                      <CheckCircle size={16} className="text-success me-2 mt-1 flex-shrink-0" />
                      <span className="small">Share class codes for easy enrollment</span>
                    </li>
                    <li className="d-flex align-items-start mb-2">
                      <CheckCircle size={16} className="text-success me-2 mt-1 flex-shrink-0" />
                      <span className="small">Create assessments and grade submissions</span>
                    </li>
                    <li className="d-flex align-items-start">
                      <CheckCircle size={16} className="text-success me-2 mt-1 flex-shrink-0" />
                      <span className="small">Track student progress and engagement</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Admin Card */}
            <div className="col-md-12 col-lg-4">
              <div className="card h-100 shadow-sm">
                <div className="card-body">
                  <div className="mb-3">
                    <GraduationCap size={40} style={{ color: 'var(--primary-blue)' }} />
                  </div>
                  <h5 className="card-title fw-bold">For Admins</h5>
                  <p className="text-muted mb-3">Oversee the entire platform</p>
                  <ul className="list-unstyled">
                    <li className="d-flex align-items-start mb-2">
                      <CheckCircle size={16} className="text-success me-2 mt-1 flex-shrink-0" />
                      <span className="small">Manage users, courses, and classes</span>
                    </li>
                    <li className="d-flex align-items-start mb-2">
                      <CheckCircle size={16} className="text-success me-2 mt-1 flex-shrink-0" />
                      <span className="small">Approve professor accounts</span>
                    </li>
                    <li className="d-flex align-items-start mb-2">
                      <CheckCircle size={16} className="text-success me-2 mt-1 flex-shrink-0" />
                      <span className="small">View platform-wide analytics</span>
                    </li>
                    <li className="d-flex align-items-start">
                      <CheckCircle size={16} className="text-success me-2 mt-1 flex-shrink-0" />
                      <span className="small">Advanced filtering and reporting</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-5 bg-light border-top">
        <div className="container text-center py-4">
          <h2 className="fw-bold mb-3 display-6">Ready to Get Started?</h2>
          <p className="lead text-muted mx-auto mb-4" style={{ maxWidth: '600px' }}>
            Join thousands of students and educators using our platform to achieve their academic goals.
          </p>
          <Link href="/sign-up" className="btn btn-primary btn-lg px-5">
            Create Your Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-top py-4">
        <div className="container">
          <div className="text-center">
            <p className="text-muted mb-2 small">&copy; 2025 CS Learning Platform. All rights reserved.</p>
            <Link href="/admin-login" className="text-muted small text-decoration-none">
              Administrator Login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
