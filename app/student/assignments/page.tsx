'use client'

import { useEffect, useState } from 'react'
import { AssessmentCard } from '@/components/student/AssessmentCard'
import { Search, Filter, Grid, List } from 'lucide-react'

type Assignment = any // We'll use the full type from the API

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    classId: '',
    type: '',
    status: '',
    sortBy: 'dueDate',
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    fetchAssignments()
  }, [filters])

  const fetchAssignments = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.classId) params.append('classId', filters.classId)
      if (filters.type) params.append('type', filters.type)
      if (filters.status) params.append('status', filters.status)
      if (filters.sortBy) params.append('sortBy', filters.sortBy)

      const response = await fetch(`/api/student/assignments?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setAssignments(data.assignments)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch assignments:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter by search term
  const filteredAssignments = assignments.filter((assignment) =>
    assignment.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const clearFilters = () => {
    setFilters({
      classId: '',
      type: '',
      status: '',
      sortBy: 'dueDate',
    })
    setSearchTerm('')
  }

  const hasActiveFilters =
    filters.classId || filters.type || filters.status || filters.sortBy !== 'dueDate' || searchTerm

  if (loading && !stats) {
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
        <h1 className="display-5 fw-bold text-primary mb-2">📋 My Assignments</h1>
        <p className="text-muted lead">
          View all your assignments, track deadlines, and manage submissions.
        </p>
      </div>

      {/* Stats Bar */}
      {stats && (
        <div className="row g-3 mb-4">
          <div className="col-6 col-md-3">
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center">
                <div className="h3 mb-1 text-primary">{stats.total}</div>
                <div className="small text-muted">Total</div>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center">
                <div className="h3 mb-1 text-warning">{stats.pending}</div>
                <div className="small text-muted">Pending</div>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center">
                <div className="h3 mb-1 text-primary">{stats.submitted}</div>
                <div className="small text-muted">Submitted</div>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center">
                <div className="h3 mb-1 text-success">{stats.graded}</div>
                <div className="small text-muted">Graded</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3">
            {/* Search */}
            <div className="col-md-3">
              <div className="input-group">
                <span className="input-group-text">
                  <Search size={18} />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search assignments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Type Filter */}
            <div className="col-md-2">
              <select
                className="form-select"
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              >
                <option value="">All Types</option>
                <option value="INTERACTIVE_LESSON">📖 Lessons</option>
                <option value="LAB">🧪 Labs</option>
                <option value="EXAM">📝 Exams</option>
                <option value="QUIZ">❓ Quizzes</option>
                <option value="DISCUSSION">💬 Discussions</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="col-md-2">
              <select
                className="form-select"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="submitted">Submitted</option>
                <option value="graded">Graded</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>

            {/* Sort By */}
            <div className="col-md-2">
              <select
                className="form-select"
                value={filters.sortBy}
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
              >
                <option value="dueDate">Sort by Due Date</option>
                <option value="title">Sort by Title</option>
                <option value="type">Sort by Type</option>
              </select>
            </div>

            {/* View Mode & Clear */}
            <div className="col-md-3 d-flex gap-2 justify-content-end">
              <div className="btn-group">
                <button
                  className={`btn btn-sm btn-outline-primary ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                >
                  <Grid size={18} />
                </button>
                <button
                  className={`btn btn-sm btn-outline-primary ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                >
                  <List size={18} />
                </button>
              </div>
              {hasActiveFilters && (
                <button className="btn btn-sm btn-outline-danger" onClick={clearFilters}>
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Assignments Grid/List */}
      {filteredAssignments.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-5">
            <Filter size={48} className="text-muted mb-3" />
            <h5 className="text-muted">No assignments found</h5>
            <p className="text-muted small mb-3">
              {hasActiveFilters
                ? 'Try adjusting your filters or search term.'
                : 'You have no assignments yet.'}
            </p>
            {hasActiveFilters && (
              <button className="btn btn-primary" onClick={clearFilters}>
                Clear All Filters
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'row g-4' : 'd-flex flex-column gap-3'}>
          {filteredAssignments.map((assignment) => (
            <div key={assignment.id} className={viewMode === 'grid' ? 'col-md-6 col-lg-4' : ''}>
              <AssessmentCard assignment={assignment} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
