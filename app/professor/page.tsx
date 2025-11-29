'use client'

import { useEffect, useState } from 'react'
import { ClassCodeCopy } from '@/components/ClassCodeCopy'
import { ClassStatusToggle } from '@/components/professor/ClassStatusToggle'
import Link from 'next/link'
import { Loader2, BookOpen, Users, FileText, School, Archive, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

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
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-accent-orange" />
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
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-2">
          Professor Dashboard
        </h1>
        <p className="text-foreground-secondary">Welcome back, {user.fullName || user.email}</p>
      </div>

      {/* Call to Action - Browse Courses */}
      {totalClasses === 0 && (
        <Card className="bg-gradient-to-br from-accent-purple to-accent-orange text-white border-0">
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-3">Ready to Get Started?</h3>
            <p className="text-lg mb-6 opacity-90">
              Browse our course catalog and adopt courses to create your first class!
            </p>
            <Button asChild size="lg" variant="default">
              <Link href="/professor/courses">
                Browse Available Courses
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {totalClasses > 0 && (
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-accent-orange" />
                Want to teach more courses?
              </h3>
              <p className="text-foreground-secondary">
                Browse our course catalog and adopt courses to create new classes.
              </p>
            </div>
            <Button asChild>
              <Link href="/professor/courses">
                Browse Courses
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-foreground-secondary">
              My Classes
            </CardTitle>
            <School className="h-5 w-5 text-accent-orange" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{totalClasses}</div>
            <p className="text-sm text-foreground-tertiary mt-1">
              {activeClasses.length} active, {pastClasses.length} past
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-foreground-secondary">
              Total Students
            </CardTitle>
            <Users className="h-5 w-5 text-accent-purple" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{totalEnrollments}</div>
            <p className="text-sm text-foreground-tertiary mt-1">Across all classes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-foreground-secondary">
              Assessments
            </CardTitle>
            <FileText className="h-5 w-5 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{totalAssessments}</div>
            <p className="text-sm text-foreground-tertiary mt-1">Total assignments</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
          className="flex items-center gap-2"
        >
          All Classes <Badge>{classes.length}</Badge>
        </Button>
        <Button
          variant={filter === 'active' ? 'default' : 'outline'}
          onClick={() => setFilter('active')}
          className="flex items-center gap-2"
        >
          Active <Badge>{activeClasses.length}</Badge>
        </Button>
        <Button
          variant={filter === 'past' ? 'default' : 'outline'}
          onClick={() => setFilter('past')}
          className="flex items-center gap-2"
        >
          Past <Badge>{pastClasses.length}</Badge>
        </Button>
      </div>

      {/* Active Classes Table */}
      {(filter === 'all' || filter === 'active') && activeClasses.length > 0 && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Active Classes</CardTitle>
            <CardDescription>
              Classes currently in session
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class Code</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Term</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead className="text-right">Students</TableHead>
                  <TableHead className="text-right">Assessments</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeClasses.map((classItem) => (
                  <TableRow key={classItem.id}>
                    <TableCell>
                      <ClassCodeCopy classCode={classItem.classCode} />
                    </TableCell>
                    <TableCell className="font-semibold">{classItem.title}</TableCell>
                    <TableCell>
                      {classItem.term} {classItem.year}
                    </TableCell>
                    <TableCell>{classItem.section || '-'}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="info">{classItem._count.enrollments}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
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

      {/* Past Classes Table */}
      {(filter === 'all' || filter === 'past') && pastClasses.length > 0 && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Past Classes</CardTitle>
            <CardDescription>
              Archived classes from previous terms
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class Code</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Term</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead className="text-right">Students</TableHead>
                  <TableHead className="text-right">Assessments</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pastClasses.map((classItem) => (
                  <TableRow key={classItem.id} className="bg-muted/50">
                    <TableCell>
                      <ClassCodeCopy classCode={classItem.classCode} />
                    </TableCell>
                    <TableCell className="font-semibold">{classItem.title}</TableCell>
                    <TableCell>
                      {classItem.term} {classItem.year}
                    </TableCell>
                    <TableCell>{classItem.section || '-'}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="info">{classItem._count.enrollments}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
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

      {/* No Classes Message */}
      {filteredClasses.length === 0 && (
        <Card className="mb-4">
          <CardContent className="text-center py-12">
            <p className="text-muted">
              {filter === 'active'
                ? 'No active classes found.'
                : filter === 'past'
                  ? 'No past classes found.'
                  : 'No classes found.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Recent Submissions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Submissions</CardTitle>
          <CardDescription>
            Latest student submissions across your classes
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {submissions.length === 0 ? (
            <p className="text-muted text-sm">No submissions yet.</p>
          ) : (
            <div className="space-y-4">
              {submissions.map((submission, index) => (
                <div
                  key={submission.id}
                  className={`flex items-center justify-between py-3 ${
                    index !== submissions.length - 1 ? 'border-b border-border' : ''
                  }`}
                >
                  <div className="flex-1">
                    <div className="font-semibold mb-1">
                      {submission.student.fullName || submission.student.email}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {submission.assessment.title} ·{' '}
                      <code className="text-accent-purple">{submission.assessment.class.classCode}</code>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold mb-1">
                      {submission.totalScore ? (
                        <span>
                          {Number(submission.totalScore).toFixed(1)}/
                          {Number(submission.assessment.maxPoints).toFixed(0)}
                        </span>
                      ) : (
                        <Badge variant="warning">Not graded</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground capitalize">
                      {submission.status?.toLowerCase() || 'submitted'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
