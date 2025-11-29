'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BookOpen, Users, CheckCircle, Clock, TrendingUp, Calendar, Loader2, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

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
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-accent-purple" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-2">My Classes</h1>
        <p className="text-foreground-secondary">
          View all your enrolled classes, track progress, and access assignments.
        </p>
      </div>

      {/* Filter Tabs */}
      <Tabs value={filter} onValueChange={(value) => setFilter(value as 'all' | 'active' | 'past')}>
        <TabsList>
          <TabsTrigger value="all">
            All Classes
            <Badge variant="default" className="ml-2">{classes.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="active">
            Active
            <Badge variant="success" className="ml-2">
              {classes.filter((c) => c.class.isActive).length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="past">
            Past
            <Badge variant="default" className="ml-2">
              {classes.filter((c) => !c.class.isActive).length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {filteredClasses.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-3" />
                <h5 className="text-lg font-semibold text-foreground mb-2">No classes found</h5>
                <p className="text-sm text-muted-foreground mb-4">
                  You are not enrolled in any classes yet.
                </p>
                <Button asChild>
                  <Link href="/student/enroll">Join a Class</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClasses.map((classData) => (
                <Card key={classData.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className={classData.class.isActive ? 'bg-gradient-to-r from-accent-purple/10 to-accent-orange/10 rounded-t-lg -mx-6 -mt-6 px-6 pt-6 mb-6' : 'bg-muted/30 rounded-t-lg -mx-6 -mt-6 px-6 pt-6 mb-6'}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{classData.class.course.code}</CardTitle>
                        <CardDescription className="mt-1">{classData.class.course.title}</CardDescription>
                      </div>
                      <Badge variant={classData.class.isActive ? 'success' : 'default'}>
                        {classData.class.isActive ? 'Active' : 'Past'}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-6 space-y-4">
                    {/* Class Info */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{classData.class.term} {classData.class.year}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>Professor: {classData.class.professor.fullName || 'N/A'}</span>
                      </div>
                      <div>
                        <code className="text-xs px-2 py-1 bg-muted rounded-lg">{classData.class.classCode}</code>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground">Total</div>
                          <div className="text-lg font-bold text-foreground">{classData.stats.totalAssessments}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground">Done</div>
                          <div className="text-lg font-bold text-success">{classData.stats.submitted}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground">Pending</div>
                          <div className="text-lg font-bold text-warning">{classData.stats.pending}</div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-semibold">{classData.stats.completionRate}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-accent-purple to-accent-orange transition-all duration-500"
                            style={{ width: `${classData.stats.completionRate}%` }}
                          />
                        </div>
                      </div>

                      {/* Average Grade */}
                      {classData.stats.averageGrade !== null && (
                        <div className="text-center pt-4 border-t">
                          <div className="text-xs text-muted-foreground mb-1">Average Grade</div>
                          <div className={`text-2xl font-bold ${getGradeColor(classData.stats.averageGrade)}`}>
                            {classData.stats.averageGrade.toFixed(1)}%
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Assessment Type Breakdown */}
                    {Object.keys(classData.stats.assessmentsByType).length > 0 && (
                      <div className="pt-4 border-t">
                        <div className="text-xs text-muted-foreground mb-2">Assessment Types:</div>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(classData.stats.assessmentsByType).map(
                            ([type, count]) => (
                              <Badge key={type} variant="outline" className="text-xs">
                                {getAssessmentTypeIcon(type)} {getAssessmentTypeName(type)}: {count}
                              </Badge>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>

                  <CardFooter>
                    <Button asChild className="w-full">
                      <Link href={`/student/assignments?classId=${classData.class.id}`}>
                        View Class Details
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="active" className="mt-6">
          {filteredClasses.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">You have no active classes.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClasses.map((classData) => (
                <Card key={classData.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="bg-gradient-to-r from-accent-purple/10 to-accent-orange/10 rounded-t-lg -mx-6 -mt-6 px-6 pt-6 mb-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{classData.class.course.code}</CardTitle>
                        <CardDescription className="mt-1">{classData.class.course.title}</CardDescription>
                      </div>
                      <Badge variant="success">Active</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{classData.class.term} {classData.class.year}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>Professor: {classData.class.professor.fullName || 'N/A'}</span>
                      </div>
                      <div>
                        <code className="text-xs px-2 py-1 bg-muted rounded-lg">{classData.class.classCode}</code>
                      </div>
                    </div>
                    <div className="border-t pt-4">
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground">Total</div>
                          <div className="text-lg font-bold text-foreground">{classData.stats.totalAssessments}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground">Done</div>
                          <div className="text-lg font-bold text-success">{classData.stats.submitted}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground">Pending</div>
                          <div className="text-lg font-bold text-warning">{classData.stats.pending}</div>
                        </div>
                      </div>
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-semibold">{classData.stats.completionRate}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-accent-purple to-accent-orange transition-all duration-500"
                            style={{ width: `${classData.stats.completionRate}%` }}
                          />
                        </div>
                      </div>
                      {classData.stats.averageGrade !== null && (
                        <div className="text-center pt-4 border-t">
                          <div className="text-xs text-muted-foreground mb-1">Average Grade</div>
                          <div className={`text-2xl font-bold ${getGradeColor(classData.stats.averageGrade)}`}>
                            {classData.stats.averageGrade.toFixed(1)}%
                          </div>
                        </div>
                      )}
                    </div>
                    {Object.keys(classData.stats.assessmentsByType).length > 0 && (
                      <div className="pt-4 border-t">
                        <div className="text-xs text-muted-foreground mb-2">Assessment Types:</div>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(classData.stats.assessmentsByType).map(
                            ([type, count]) => (
                              <Badge key={type} variant="outline" className="text-xs">
                                {getAssessmentTypeIcon(type)} {getAssessmentTypeName(type)}: {count}
                              </Badge>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button asChild className="w-full">
                      <Link href={`/student/assignments?classId=${classData.class.id}`}>
                        View Class Details
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="past" className="mt-6">
          {filteredClasses.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">You have no past classes.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClasses.map((classData) => (
                <Card key={classData.id} className="hover:shadow-lg transition-shadow opacity-90">
                  <CardHeader className="bg-muted/30 rounded-t-lg -mx-6 -mt-6 px-6 pt-6 mb-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{classData.class.course.code}</CardTitle>
                        <CardDescription className="mt-1">{classData.class.course.title}</CardDescription>
                      </div>
                      <Badge variant="default">Past</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{classData.class.term} {classData.class.year}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>Professor: {classData.class.professor.fullName || 'N/A'}</span>
                      </div>
                      <div>
                        <code className="text-xs px-2 py-1 bg-muted rounded-lg">{classData.class.classCode}</code>
                      </div>
                    </div>
                    <div className="border-t pt-4">
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground">Total</div>
                          <div className="text-lg font-bold text-foreground">{classData.stats.totalAssessments}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground">Done</div>
                          <div className="text-lg font-bold text-success">{classData.stats.submitted}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground">Pending</div>
                          <div className="text-lg font-bold text-warning">{classData.stats.pending}</div>
                        </div>
                      </div>
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-semibold">{classData.stats.completionRate}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-accent-purple to-accent-orange transition-all duration-500"
                            style={{ width: `${classData.stats.completionRate}%` }}
                          />
                        </div>
                      </div>
                      {classData.stats.averageGrade !== null && (
                        <div className="text-center pt-4 border-t">
                          <div className="text-xs text-muted-foreground mb-1">Average Grade</div>
                          <div className={`text-2xl font-bold ${getGradeColor(classData.stats.averageGrade)}`}>
                            {classData.stats.averageGrade.toFixed(1)}%
                          </div>
                        </div>
                      )}
                    </div>
                    {Object.keys(classData.stats.assessmentsByType).length > 0 && (
                      <div className="pt-4 border-t">
                        <div className="text-xs text-muted-foreground mb-2">Assessment Types:</div>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(classData.stats.assessmentsByType).map(
                            ([type, count]) => (
                              <Badge key={type} variant="outline" className="text-xs">
                                {getAssessmentTypeIcon(type)} {getAssessmentTypeName(type)}: {count}
                              </Badge>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button asChild variant="outline" className="w-full">
                      <Link href={`/student/assignments?classId=${classData.class.id}`}>
                        View Class Details
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
