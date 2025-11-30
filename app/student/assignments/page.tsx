'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { AssessmentCard } from '@/components/student/AssessmentCard'
import { ModuleAssignmentsView } from '@/components/student/ModuleAssignmentsView'
import { Search, Filter, LayoutGrid, List, Loader2, X, Layers, BookOpen } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

type Assignment = any // We'll use the full type from the API

const LAST_CLASS_STORAGE_KEY = 'student_last_viewed_class'

export default function AssignmentsPage() {
  const searchParams = useSearchParams()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [modulesByClass, setModulesByClass] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    classId: '',
    type: 'all',
    status: 'all',
    sortBy: 'dueDate',
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'modules'>('modules')

  // Fetch classes on mount
  useEffect(() => {
    fetchClasses()
  }, [])

  // Initialize filter from URL or localStorage or first class
  useEffect(() => {
    if (classes.length === 0) return

    // Priority 1: URL parameter
    const classIdParam = searchParams.get('classId')
    if (classIdParam) {
      if (classes.some((c) => c.class.id === classIdParam)) {
        setFilters((prev) => ({ ...prev, classId: classIdParam }))
        localStorage.setItem(LAST_CLASS_STORAGE_KEY, classIdParam)
        return
      }
    }

    // Priority 2: localStorage
    const savedClassId = localStorage.getItem(LAST_CLASS_STORAGE_KEY)
    if (savedClassId) {
      // Validate: check if still enrolled
      if (classes.some((c) => c.class.id === savedClassId)) {
        setFilters((prev) => ({ ...prev, classId: savedClassId }))
        return
      } else {
        // Invalid - clear localStorage
        localStorage.removeItem(LAST_CLASS_STORAGE_KEY)
      }
    }

    // Priority 3: First class (default)
    if (classes.length > 0) {
      const firstClassId = classes[0].class.id
      setFilters((prev) => ({ ...prev, classId: firstClassId }))
      localStorage.setItem(LAST_CLASS_STORAGE_KEY, firstClassId)
    }
  }, [searchParams, classes])

  useEffect(() => {
    fetchAssignments()
  }, [filters])

  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/student/classes')
      if (response.ok) {
        const data = await response.json()
        setClasses(data.classes || [])
      }
    } catch (error) {
      console.error('Failed to fetch classes:', error)
    }
  }

  const fetchAssignments = async () => {
    // Don't fetch if no class is selected (happens when student has no classes)
    if (!filters.classId) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('classId', filters.classId)
      if (filters.type && filters.type !== 'all') params.append('type', filters.type)
      if (filters.status && filters.status !== 'all') params.append('status', filters.status)
      if (filters.sortBy) params.append('sortBy', filters.sortBy)

      const response = await fetch(`/api/student/assignments?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setAssignments(data.assignments)
        setModulesByClass(data.modulesByClass || [])
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

  const handleClassFilterChange = (value: string) => {
    setFilters({ ...filters, classId: value })
    // Save to localStorage
    localStorage.setItem(LAST_CLASS_STORAGE_KEY, value)
  }

  const clearFilters = () => {
    // Keep the current class selected, only clear other filters
    setFilters({
      ...filters,
      type: 'all',
      status: 'all',
      sortBy: 'dueDate',
    })
    setSearchTerm('')
  }

  const hasActiveFilters =
    filters.type !== 'all' || filters.status !== 'all' || filters.sortBy !== 'dueDate' || searchTerm

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-accent-purple" />
      </div>
    )
  }

  // If student has no classes, show join class message
  if (classes.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-2">My Assignments</h1>
          <p className="text-foreground-secondary">View your assignments, track deadlines, and manage submissions.</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-3" />
            <h5 className="text-lg font-semibold text-foreground mb-2">No Classes Yet</h5>
            <p className="text-sm text-muted-foreground mb-4 text-center">
              You need to join a class to view assignments.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentClass = classes.find((c) => c.class.id === filters.classId)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-2">My Assignments</h1>
        <p className="text-foreground-secondary">View your assignments, track deadlines, and manage submissions.</p>
      </div>

      {/* Compact Header: Class + Stats + Quick Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-3">
        {/* Left: Class Selector + Stats */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <div className="p-3">
              {/* Class Selector - Compact */}
              <div className="flex items-center gap-3 mb-3 pb-3 border-b border-border">
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground mb-0.5">Class:</div>
                  {currentClass && (
                    <div className="font-semibold text-sm truncate">
                      {currentClass.class.course.code} - {currentClass.class.course.title}
                    </div>
                  )}
                </div>
                <div className="w-48">
                  <Select value={filters.classId} onValueChange={handleClassFilterChange}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Select Class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((classData) => (
                        <SelectItem key={classData.class.id} value={classData.class.id}>
                          {classData.class.course.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Stats Grid - Compact */}
              {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div className="border-l-4 border-l-accent-purple bg-background-secondary/30 rounded p-2">
                    <div className="text-xs text-foreground-tertiary mb-1">Total</div>
                    <div className="text-xl font-bold text-foreground">{stats.total}</div>
                  </div>
                  <div className="border-l-4 border-l-warning bg-background-secondary/30 rounded p-2">
                    <div className="text-xs text-foreground-tertiary mb-1">Pending</div>
                    <div className="text-xl font-bold text-warning">{stats.pending}</div>
                  </div>
                  <div className="border-l-4 border-l-info bg-background-secondary/30 rounded p-2">
                    <div className="text-xs text-foreground-tertiary mb-1">Submitted</div>
                    <div className="text-xl font-bold text-info">{stats.submitted}</div>
                  </div>
                  <div className="border-l-4 border-l-success bg-background-secondary/30 rounded p-2">
                    <div className="text-xs text-foreground-tertiary mb-1">Graded</div>
                    <div className="text-xl font-bold text-success">{stats.graded}</div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right: Quick Filters */}
        <Card className="p-3">
          <div className="space-y-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Type</label>
              <Select value={filters.type} onValueChange={(value) => setFilters({ ...filters, type: value })}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="INTERACTIVE_LESSON">Lessons</SelectItem>
                  <SelectItem value="LAB">Labs</SelectItem>
                  <SelectItem value="EXAM">Exams</SelectItem>
                  <SelectItem value="QUIZ">Quizzes</SelectItem>
                  <SelectItem value="DISCUSSION">Discussions</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Status</label>
              <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="graded">Graded</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">View</label>
              <div className="flex border rounded-lg overflow-hidden">
                <Button
                  variant={viewMode === 'modules' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('modules')}
                  className="flex-1 rounded-none h-8"
                >
                  <Layers className="h-3 w-3" />
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="flex-1 rounded-none h-8"
                >
                  <LayoutGrid className="h-3 w-3" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="flex-1 rounded-none h-8"
                >
                  <List className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Compact Search and Sort Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search assignments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <Select value={filters.sortBy} onValueChange={(value) => setFilters({ ...filters, sortBy: value })}>
          <SelectTrigger className="w-40 h-9">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="dueDate">Due Date</SelectItem>
            <SelectItem value="title">Title</SelectItem>
            <SelectItem value="type">Type</SelectItem>
          </SelectContent>
        </Select>
        {hasActiveFilters && (
          <Button variant="outline" size="sm" onClick={clearFilters} className="h-9">
            <X className="h-4 w-4 mr-1.5" />
            Clear
          </Button>
        )}
      </div>

      {/* Assignments Grid/List/Modules */}
      {viewMode === 'modules' ? (
        <ModuleAssignmentsView modulesByClass={modulesByClass} />
      ) : filteredAssignments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Filter className="h-12 w-12 text-muted-foreground mb-3" />
            <h5 className="text-lg font-semibold text-foreground mb-2">No assignments found</h5>
            <p className="text-sm text-muted-foreground mb-4">
              {hasActiveFilters
                ? 'Try adjusting your filters or search term.'
                : 'You have no assignments yet.'}
            </p>
            {hasActiveFilters && (
              <Button onClick={clearFilters}>
                Clear All Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'flex flex-col gap-4'}>
          {filteredAssignments.map((assignment) => (
            <AssessmentCard key={assignment.id} assignment={assignment} />
          ))}
        </div>
      )}
    </div>
  )
}
