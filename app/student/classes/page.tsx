'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BookOpen, Users, CheckCircle, Clock, TrendingUp, Calendar } from 'lucide-react'

type ClassData = {
  id: string
  enrolledAt: string
  class: {
    id: string
    title: string
    classCode: string
    term: string
    year: number
    section: string | null
    isActive: boolean
    course: {
      code: string
      title: string
      description: string | null
    }
    professor: {
      fullName: string | null
      email: string
    }
    studentCount: number
  }
  stats: {
    totalAssessments: number
    submitted: number
    graded: number
    pending: number
    completionRate: number
    averageGrade: number | null
    assessmentsByType: Record<string, number>
  }
}

export default function MyClassesPage() {
  const [classes, setClasses] = useState<ClassData[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'past'>('all')

  useEffect(() => {
    fetchClasses()
  }, [])

  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/student/classes')
      if (response.ok) {
        const data = await response.json()
        setClasses(data.classes)
      }
    } catch (error) {
      console.error('Failed to fetch classes:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredClasses = classes.filter((classData) => {
    if (filter === 'active') return classData.class.isActive
    if (filter === 'past') return !classData.class.isActive
    return true
  })

  const getGradeColor = (grade: number | null) => {
    if (grade === null) return 'text-muted'
    if (grade >= 90) return 'text-success'
    if (grade >= 80) return 'text-primary'
    if (grade >= 70) return 'text-warning'
    return 'text-danger'
  }

  const getGradeBadge = (grade: number | null) => {
    if (grade === null) return 'bg-secondary'
    if (grade >= 90) return 'bg-success'
    if (grade >= 80) return 'bg-primary'
    if (grade >= 70) return 'bg-warning'
    return 'bg-danger'
  }

  const getAssessmentTypeIcon = (type: string) => {
    switch (type) {
      case 'INTERACTIVE_LESSON':
        return '📖'
      case 'LAB':
        return '🧪'
      case 'EXAM':
        return '📝'
      case 'QUIZ':
        return '❓'
      case 'DISCUSSION':
        return '💬'
      default:
        return '📄'
    }
  }

  const getAssessmentTypeName = (type: string) => {
    switch (type) {
      case 'INTERACTIVE_LESSON':
        return 'Lessons'
      case 'LAB':
        return 'Labs'
      case 'EXAM':
        return 'Exams'
      case 'QUIZ':
        return 'Quizzes'
      case 'DISCUSSION':
        return 'Discussions'
      default:
        return type
    }
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-4">
        <h1 className="display-5 fw-bold text-primary mb-2">📚 My Classes</h1>
        <p className="text-muted lead">
          View all your enrolled classes, track progress, and access assignments.
        </p>
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
            Active{' '}
            <span className="badge bg-success ms-2">
              {classes.filter((c) => c.class.isActive).length}
            </span>
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${filter === 'past' ? 'active' : ''}`}
            onClick={() => setFilter('past')}
          >
            Past{' '}
            <span className="badge bg-secondary ms-2">
              {classes.filter((c) => !c.class.isActive).length}
            </span>
          </button>
        </li>
      </ul>

      {/* Classes Grid */}
      {filteredClasses.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-5">
            <BookOpen size={48} className="text-muted mb-3" />
            <h5 className="text-muted">No classes found</h5>
            <p className="text-muted small mb-3">
              {filter === 'all'
                ? 'You are not enrolled in any classes yet.'
                : `You have no ${filter} classes.`}
            </p>
            <Link href="/student/enroll" className="btn btn-primary">
              Join a Class
            </Link>
          </div>
        </div>
      ) : (
        <div className="row g-4">
          {filteredClasses.map((classData) => (
            <div key={classData.id} className="col-md-6 col-lg-4">
              <div className="card h-100 border-0 shadow-sm hover-shadow">
                {/* Card Header */}
                <div
                  className={`card-header text-white ${
                    classData.class.isActive ? 'bg-primary' : 'bg-secondary'
                  }`}
                >
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="flex-grow-1">
                      <h5 className="card-title mb-1">{classData.class.course.code}</h5>
                      <p className="mb-0 small opacity-90">{classData.class.course.title}</p>
                    </div>
                    <span
                      className={`badge ${
                        classData.class.isActive ? 'bg-success' : 'bg-dark'
                      }`}
                    >
                      {classData.class.isActive ? 'Active' : 'Past'}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="card-body">
                  {/* Class Info */}
                  <div className="mb-3">
                    <div className="d-flex align-items-center text-muted small mb-2">
                      <Calendar size={14} className="me-2" />
                      <span>
                        {classData.class.term} {classData.class.year}
                      </span>
                    </div>
                    <div className="d-flex align-items-center text-muted small mb-2">
                      <Users size={14} className="me-2" />
                      <span>
                        Professor: {classData.class.professor.fullName || 'N/A'}
                      </span>
                    </div>
                    <div className="small">
                      <code className="text-primary">{classData.class.classCode}</code>
                    </div>
                  </div>

                  <hr />

                  {/* Stats */}
                  <div className="mb-3">
                    <div className="row text-center mb-2">
                      <div className="col-4">
                        <div className="text-muted small">Total</div>
                        <div className="fw-bold">{classData.stats.totalAssessments}</div>
                      </div>
                      <div className="col-4">
                        <div className="text-muted small">Done</div>
                        <div className="fw-bold text-success">{classData.stats.submitted}</div>
                      </div>
                      <div className="col-4">
                        <div className="text-muted small">Pending</div>
                        <div className="fw-bold text-warning">{classData.stats.pending}</div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-2">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <small className="text-muted">Progress</small>
                        <small className="fw-bold">{classData.stats.completionRate}%</small>
                      </div>
                      <div className="progress" style={{ height: '6px' }}>
                        <div
                          className="progress-bar bg-success"
                          role="progressbar"
                          style={{ width: `${classData.stats.completionRate}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Average Grade */}
                    {classData.stats.averageGrade !== null && (
                      <div className="text-center mt-3">
                        <div className="small text-muted mb-1">Average Grade</div>
                        <h4 className={`mb-0 ${getGradeColor(classData.stats.averageGrade)}`}>
                          {classData.stats.averageGrade.toFixed(1)}%
                        </h4>
                      </div>
                    )}
                  </div>

                  {/* Assessment Type Breakdown */}
                  {Object.keys(classData.stats.assessmentsByType).length > 0 && (
                    <div>
                      <div className="small text-muted mb-2">Assessment Types:</div>
                      <div className="d-flex flex-wrap gap-2">
                        {Object.entries(classData.stats.assessmentsByType).map(
                          ([type, count]) => (
                            <span key={type} className="badge bg-light text-dark border">
                              {getAssessmentTypeIcon(type)} {getAssessmentTypeName(type)}: {count}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div className="card-footer bg-transparent border-top-0">
                  <Link
                    href={`/student/classes/${classData.class.id}`}
                    className="btn btn-primary w-100"
                  >
                    View Class Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
