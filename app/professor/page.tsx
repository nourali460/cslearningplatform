'use client'

import { useEffect, useState } from 'react'
import { ClassCodeCopy } from '@/components/ClassCodeCopy'
import { ClassStatusToggle } from '@/components/professor/ClassStatusToggle'
import Link from 'next/link'

type Class = {
  id: string
  classCode: string
  title: string
  term: string
  year: number
  section: string | null
  isActive: boolean
  _count: {
    enrollments: number
    assessments: number
  }
}

type Submission = {
  id: string
  totalScore: number | null
  status: string | null
  student: {
    fullName: string | null
    email: string
  }
  assessment: {
    title: string
    maxPoints: number
    class: {
      classCode: string
    }
  }
}

export default function ProfessorDashboard() {
  const [user, setUser] = useState<any>(null)
  const [classes, setClasses] = useState<Class[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'past'>('all')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch professor data
      const userRes = await fetch('/api/professor/whoami')
      if (!userRes.ok) {
        window.location.href = '/sign-in'
        return
      }
      const userData = await userRes.json()
      setUser(userData)

      // Fetch classes
      const classesRes = await fetch('/api/professor/classes')
      if (classesRes.ok) {
        const classesData = await classesRes.json()
        setClasses(classesData.classes || [])
      }

      // Fetch recent submissions
      const submissionsRes = await fetch('/api/professor/submissions?limit=5')
      if (submissionsRes.ok) {
        const submissionsData = await submissionsRes.json()
        setSubmissions(submissionsData.submissions || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !user) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  const activeClasses = classes.filter((c) => c.isActive)
  const pastClasses = classes.filter((c) => !c.isActive)

  const filteredClasses =
    filter === 'active' ? activeClasses : filter === 'past' ? pastClasses : classes

  const totalClasses = classes.length
  const totalEnrollments = classes.reduce((sum, cls) => sum + cls._count.enrollments, 0)
  const totalAssessments = classes.reduce((sum, cls) => sum + cls._count.assessments, 0)

  return (
    <div>
      {/* Header */}
      <div className="mb-4">
        <h1 className="display-5 fw-bold text-primary mb-2">📊 Professor Dashboard</h1>
        <p className="text-muted lead">Welcome back, {user.fullName || user.email}</p>
      </div>

      {/* Call to Action - Browse Courses */}
      {totalClasses === 0 && (
        <div
          className="card mb-4 border-0 shadow-sm"
          style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
        >
          <div className="card-body py-5 text-white text-center">
            <div className="mb-3">
              <i className="bi bi-book" style={{ fontSize: '3rem' }}></i>
            </div>
            <h3 className="fw-bold mb-3">Ready to Get Started?</h3>
            <p className="lead mb-4">
              Browse our course catalog and adopt courses to create your first class!
            </p>
            <Link href="/professor/courses" className="btn btn-light btn-lg shadow">
              <i className="bi bi-search me-2"></i>
              Browse Available Courses
            </Link>
          </div>
        </div>
      )}

      {totalClasses > 0 && (
        <div className="card mb-4 border-primary">
          <div className="card-body d-flex align-items-center justify-content-between">
            <div>
              <h5 className="fw-bold mb-2">
                <i className="bi bi-book me-2 text-primary"></i>
                Want to teach more courses?
              </h5>
              <p className="text-muted mb-0">
                Browse our course catalog and adopt courses to create new classes.
              </p>
            </div>
            <div>
              <Link href="/professor/courses" className="btn btn-primary">
                <i className="bi bi-search me-2"></i>
                Browse Courses
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="row g-4 mb-5">
        <div className="col-md-4">
          <div className="card h-100 border-primary">
            <div className="card-body">
              <h6 className="card-subtitle text-muted mb-3 small">My Classes</h6>
              <h2 className="card-title text-primary fw-bold mb-2">{totalClasses}</h2>
              <p className="text-muted mb-0 small">
                {activeClasses.length} active, {pastClasses.length} past
              </p>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card h-100 border-primary">
            <div className="card-body">
              <h6 className="card-subtitle text-muted mb-3 small">Total Students</h6>
              <h2 className="card-title text-primary fw-bold mb-2">{totalEnrollments}</h2>
              <p className="text-muted mb-0 small">Across all classes</p>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card h-100 border-primary">
            <div className="card-body">
              <h6 className="card-subtitle text-muted mb-3 small">Assessments</h6>
              <h2 className="card-title text-primary fw-bold mb-2">{totalAssessments}</h2>
              <p className="text-muted mb-0 small">Total assignments</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <ul className="nav nav-pills mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Classes <span className="badge bg-primary ms-2">{classes.length}</span>
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${filter === 'active' ? 'active' : ''}`}
            onClick={() => setFilter('active')}
          >
            Active <span className="badge bg-success ms-2">{activeClasses.length}</span>
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${filter === 'past' ? 'active' : ''}`}
            onClick={() => setFilter('past')}
          >
            Past <span className="badge bg-secondary ms-2">{pastClasses.length}</span>
          </button>
        </li>
      </ul>

      {/* Active Classes Table */}
      {(filter === 'all' || filter === 'active') && activeClasses.length > 0 && (
        <div className="card mb-4">
          <div className="card-header bg-success text-white">
            <h5 className="card-title mb-1">📚 Active Classes</h5>
            <p className="mb-0 small opacity-90">Classes currently in session</p>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr className="border-bottom">
                    <th className="py-3">Class Code</th>
                    <th className="py-3">Title</th>
                    <th className="py-3">Term</th>
                    <th className="py-3">Section</th>
                    <th className="py-3 text-end">Students</th>
                    <th className="py-3 text-end">Assessments</th>
                    <th className="py-3 text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activeClasses.map((classItem) => (
                    <tr key={classItem.id}>
                      <td className="py-3">
                        <ClassCodeCopy classCode={classItem.classCode} />
                      </td>
                      <td className="py-3 fw-semibold">{classItem.title}</td>
                      <td className="py-3">
                        {classItem.term} {classItem.year}
                      </td>
                      <td className="py-3">{classItem.section || '-'}</td>
                      <td className="py-3 text-end">
                        <span className="badge bg-info">{classItem._count.enrollments}</span>
                      </td>
                      <td className="py-3 text-end">
                        <span className="badge bg-info">{classItem._count.assessments}</span>
                      </td>
                      <td className="py-3 text-end">
                        <ClassStatusToggle
                          classId={classItem.id}
                          isActive={classItem.isActive}
                          onToggle={fetchData}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Past Classes Table */}
      {(filter === 'all' || filter === 'past') && pastClasses.length > 0 && (
        <div className="card mb-4">
          <div className="card-header bg-secondary text-white">
            <h5 className="card-title mb-1">📦 Past Classes</h5>
            <p className="mb-0 small opacity-90">Archived classes from previous terms</p>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr className="border-bottom">
                    <th className="py-3">Class Code</th>
                    <th className="py-3">Title</th>
                    <th className="py-3">Term</th>
                    <th className="py-3">Section</th>
                    <th className="py-3 text-end">Students</th>
                    <th className="py-3 text-end">Assessments</th>
                    <th className="py-3 text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pastClasses.map((classItem) => (
                    <tr key={classItem.id} className="table-secondary">
                      <td className="py-3">
                        <ClassCodeCopy classCode={classItem.classCode} />
                      </td>
                      <td className="py-3 fw-semibold">{classItem.title}</td>
                      <td className="py-3">
                        {classItem.term} {classItem.year}
                      </td>
                      <td className="py-3">{classItem.section || '-'}</td>
                      <td className="py-3 text-end">
                        <span className="badge bg-secondary">{classItem._count.enrollments}</span>
                      </td>
                      <td className="py-3 text-end">
                        <span className="badge bg-secondary">{classItem._count.assessments}</span>
                      </td>
                      <td className="py-3 text-end">
                        <ClassStatusToggle
                          classId={classItem.id}
                          isActive={classItem.isActive}
                          onToggle={fetchData}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* No Classes Message */}
      {filteredClasses.length === 0 && (
        <div className="card mb-4">
          <div className="card-body text-center py-5">
            <p className="text-muted mb-0">
              {filter === 'active'
                ? 'No active classes found.'
                : filter === 'past'
                  ? 'No past classes found.'
                  : 'No classes found.'}
            </p>
          </div>
        </div>
      )}

      {/* Recent Submissions */}
      <div className="card">
        <div className="card-header bg-primary text-white">
          <h5 className="card-title mb-1">📝 Recent Submissions</h5>
          <p className="mb-0 small opacity-90">Latest student submissions across your classes</p>
        </div>
        <div className="card-body">
          {submissions.length === 0 ? (
            <p className="text-muted mb-0 small">No submissions yet.</p>
          ) : (
            <div>
              {submissions.map((submission, index) => (
                <div
                  key={submission.id}
                  className={`d-flex align-items-center justify-content-between py-3 ${
                    index !== submissions.length - 1 ? 'border-bottom' : ''
                  }`}
                >
                  <div>
                    <div className="fw-semibold mb-1">
                      {submission.student.fullName || submission.student.email}
                    </div>
                    <div className="small text-muted">
                      {submission.assessment.title} ·{' '}
                      <code className="text-primary">{submission.assessment.class.classCode}</code>
                    </div>
                  </div>
                  <div className="text-end">
                    <div className="fw-semibold mb-1">
                      {submission.totalScore ? (
                        <span>
                          {Number(submission.totalScore).toFixed(1)}/
                          {Number(submission.assessment.maxPoints).toFixed(0)}
                        </span>
                      ) : (
                        <span className="badge bg-warning text-dark">Not graded</span>
                      )}
                    </div>
                    <div className="small text-muted text-capitalize">
                      {submission.status?.toLowerCase() || 'submitted'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
