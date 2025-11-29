'use client'

import { useState, useEffect } from 'react'
import { Library, CheckCircle, Search, Filter, BookOpen, Archive, Loader2, AlertCircle } from 'lucide-react'
import { CreateClassModal } from '@/components/professor/CreateClassModal'
import { ClassCodeCopy } from '@/components/ClassCodeCopy'
import { ClassStatusToggle } from '@/components/professor/ClassStatusToggle'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface Course {
  id: string
  code: string
  title: string
  description: string | null
  subject: string | null
  level: string | null
}

interface ProfessorClass {
  id: string
  classCode: string
  title: string
  term: string
  year: number
  section: string | null
  isActive: boolean
  course: Course
  _count: {
    enrollments: number
    assessments: number
  }
  createdAt: string
}

export default function AvailableCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [myClasses, setMyClasses] = useState<ProfessorClass[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [professorSchoolId, setProfessorSchoolId] = useState<string>('')
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [subjectFilter, setSubjectFilter] = useState<string>('all')
  const [levelFilter, setLevelFilter] = useState<string>('all')
  const [classFilter, setClassFilter] = useState<'all' | 'active' | 'past'>('all')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      await Promise.all([
        fetchCourses(),
        fetchMyClasses(),
        fetchProfessorProfile(),
      ])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const fetchCourses = async () => {
    const response = await fetch('/api/courses')
    if (!response.ok) {
      throw new Error('Failed to fetch courses')
    }
    const data = await response.json()
    setCourses(data.courses || [])
  }

  const fetchMyClasses = async () => {
    const response = await fetch('/api/professor/classes')
    if (!response.ok) {
      throw new Error('Failed to fetch your classes')
    }
    const data = await response.json()
    setMyClasses(data.classes || [])
  }

  const fetchProfessorProfile = async () => {
    try {
      const response = await fetch('/api/professor/profile')
      if (response.ok) {
        const data = await response.json()
        setProfessorSchoolId(data.professor.schoolId || '')
      }
    } catch (err) {
      console.error('Failed to fetch professor profile:', err)
    }
  }

  const handleClassCreated = async () => {
    setSuccessMessage('Class created successfully! You can now view it in "My Classes" below.')
    setTimeout(() => setSuccessMessage(null), 5000)
    await fetchMyClasses()
  }

  // Get unique subjects and levels
  const subjects = Array.from(new Set(courses.map(c => c.subject).filter(Boolean))) as string[]
  const levels = Array.from(new Set(courses.map(c => c.level).filter(Boolean))) as string[]

  // Filter courses
  const filteredCourses = courses.filter(course => {
    const matchesSearch =
      course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (course.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)

    const matchesSubject = subjectFilter === 'all' || course.subject === subjectFilter
    const matchesLevel = levelFilter === 'all' || course.level === levelFilter

    return matchesSearch && matchesSubject && matchesLevel
  })

  // Filter classes
  const activeClasses = myClasses.filter(c => c.isActive)
  const pastClasses = myClasses.filter(c => !c.isActive)
  const displayedClasses = classFilter === 'active' ? activeClasses :
                          classFilter === 'past' ? pastClasses : myClasses

  const hasActiveFilters = searchTerm || subjectFilter !== 'all' || levelFilter !== 'all'

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-2 flex items-center gap-2">
          <Library className="h-8 w-8" />
          Available Courses
        </h1>
        <p className="text-foreground-secondary">
          Browse the course catalog and manage your classes
        </p>
      </div>

      {/* Success Alert */}
      {successMessage && (
        <Card className="border-l-4 border-l-success bg-success/10">
          <CardContent className="flex items-center justify-between py-3">
            <div className="flex items-center gap-2">
              <CheckCircle size={20} className="text-success" />
              <span>{successMessage}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSuccessMessage(null)}>
              ×
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Error Alert */}
      {error && (
        <Card className="border-l-4 border-l-error bg-error/10">
          <CardContent className="flex items-center gap-2 py-3">
            <AlertCircle size={20} className="text-error" />
            <span>{error}</span>
          </CardContent>
        </Card>
      )}

      {/* My Classes Section */}
      {!loading && myClasses.length > 0 && (
        <div className="mb-5">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h2 className="h4 fw-bold text-primary mb-1">
                <BookOpen className="me-2" style={{ display: 'inline', marginTop: '-4px' }} />
                My Classes
              </h2>
              <p className="text-muted small mb-0">
                Classes you've created from the course catalog
              </p>
            </div>
          </div>

          {/* Class Filter Tabs */}
          <div className="flex gap-2 mb-4">
            <Button
              variant={classFilter === 'all' ? 'default' : 'outline'}
              onClick={() => setClassFilter('all')}
              className="flex items-center gap-2"
            >
              All <Badge variant="purple">{myClasses.length}</Badge>
            </Button>
            <Button
              variant={classFilter === 'active' ? 'default' : 'outline'}
              onClick={() => setClassFilter('active')}
              className="flex items-center gap-2"
            >
              Active <Badge variant="success">{activeClasses.length}</Badge>
            </Button>
            <Button
              variant={classFilter === 'past' ? 'default' : 'outline'}
              onClick={() => setClassFilter('past')}
              className="flex items-center gap-2"
            >
              Past <Badge>{pastClasses.length}</Badge>
            </Button>
          </div>

          {/* Active Classes */}
          {(classFilter === 'all' || classFilter === 'active') && activeClasses.length > 0 && (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Active Classes</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Class Code</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Term</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead className="text-center">Students</TableHead>
                      <TableHead className="text-center">Assessments</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeClasses.map((classItem) => (
                      <TableRow key={classItem.id}>
                        <TableCell>
                          <ClassCodeCopy classCode={classItem.classCode} />
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold">{classItem.course.code}</div>
                          <div className="text-sm text-muted-foreground">{classItem.course.title}</div>
                        </TableCell>
                        <TableCell>
                          {classItem.term} {classItem.year}
                        </TableCell>
                        <TableCell>
                          <Badge>Section {classItem.section}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="info">{classItem._count.enrollments}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="info">{classItem._count.assessments}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <ClassStatusToggle
                            classId={classItem.id}
                            isActive={classItem.isActive}
                            onToggle={fetchData}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Past Classes */}
          {(classFilter === 'all' || classFilter === 'past') && pastClasses.length > 0 && (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Past Classes</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Class Code</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Term</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead className="text-center">Students</TableHead>
                      <TableHead className="text-center">Assessments</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pastClasses.map((classItem) => (
                      <TableRow key={classItem.id} className="bg-muted/50">
                        <TableCell>
                          <ClassCodeCopy classCode={classItem.classCode} />
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold">{classItem.course.code}</div>
                          <div className="text-sm text-muted-foreground">{classItem.course.title}</div>
                        </TableCell>
                        <TableCell>
                          {classItem.term} {classItem.year}
                        </TableCell>
                        <TableCell>
                          <Badge>Section {classItem.section}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge>{classItem._count.enrollments}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge>{classItem._count.assessments}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <ClassStatusToggle
                            classId={classItem.id}
                            isActive={classItem.isActive}
                            onToggle={fetchData}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {displayedClasses.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">
                  {classFilter === 'active' ? 'No active classes found.' :
                   classFilter === 'past' ? 'No past classes found.' :
                   'No classes found.'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Course Catalog Section */}
      <div className="mb-4">
        <h2 className="h4 fw-bold text-primary mb-2">
          <i className="bi bi-grid-3x3-gap-fill me-2"></i>
          Course Catalog
        </h2>
        <p className="text-muted mb-0">
          Browse and adopt courses to create new classes
        </p>
      </div>

      {/* Search and Filters */}
      {!loading && courses.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              {/* Search */}
              <div className="md:col-span-5">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search courses by code, title, or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Subject Filter */}
              <div className="md:col-span-3">
                <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Subjects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    {subjects.map((subject) => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Level Filter */}
              <div className="md:col-span-2">
                <Select value={levelFilter} onValueChange={setLevelFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    {levels.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <div className="md:col-span-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setSearchTerm('')
                      setSubjectFilter('all')
                      setLevelFilter('all')
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>

            {/* Filter Stats */}
            {hasActiveFilters && (
              <div className="mt-4">
                <span className="text-sm text-muted-foreground">
                  Showing {filteredCourses.length} of {courses.length} courses
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-accent-orange mb-4" />
          <p className="text-muted-foreground">Loading courses...</p>
        </div>
      ) : filteredCourses.length === 0 ? (
        /* Empty State */
        <Card>
          <CardContent className="text-center py-12">
            <Filter size={64} className="text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No courses found</h3>
            <p className="text-muted-foreground mb-6">
              {hasActiveFilters
                ? 'Try adjusting your filters or search term.'
                : 'There are no courses in the catalog at this time.'}
            </p>
            {hasActiveFilters && (
              <Button
                onClick={() => {
                  setSearchTerm('')
                  setSubjectFilter('all')
                  setLevelFilter('all')
                }}
              >
                Clear All Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        /* Course Cards Grid */
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {filteredCourses.map((course) => (
              <Card key={course.id} className="flex flex-col border-l-4 border-l-accent-purple">
                <CardHeader>
                  {/* Course Code Badge */}
                  <div className="flex gap-2 mb-3">
                    <Badge variant="purple" className="text-base">{course.code}</Badge>
                    {course.level && (
                      <Badge variant="info">{course.level}</Badge>
                    )}
                  </div>

                  {/* Course Title */}
                  <CardTitle className="mb-2">{course.title}</CardTitle>

                  {/* Course Subject */}
                  {course.subject && (
                    <CardDescription className="flex items-center gap-1">
                      {course.subject}
                    </CardDescription>
                  )}
                </CardHeader>

                <CardContent className="flex-1 flex flex-col">
                  {/* Course Description */}
                  <p className="text-sm text-muted-foreground mb-4 flex-1">
                    {course.description || 'No description available.'}
                  </p>

                  {/* Adopt Button */}
                  <Button
                    type="button"
                    className="w-full"
                    onClick={() => setSelectedCourse(course)}
                  >
                    Adopt Course
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Course Statistics */}
          <Card className="bg-muted/50">
            <CardContent className="text-center py-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="text-4xl font-bold text-accent-purple mb-1">{courses.length}</div>
                  <div className="text-sm text-muted-foreground">Total Courses</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-success mb-1">{subjects.length}</div>
                  <div className="text-sm text-muted-foreground">Subjects</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-info mb-1">{myClasses.length}</div>
                  <div className="text-sm text-muted-foreground">My Classes</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Class Creation Modal */}
      {selectedCourse && (
        <CreateClassModal
          course={selectedCourse}
          professorSchoolId={professorSchoolId || ''}
          existingClasses={myClasses}
          onClose={() => setSelectedCourse(null)}
          onSuccess={handleClassCreated}
        />
      )}
    </div>
  )
}
