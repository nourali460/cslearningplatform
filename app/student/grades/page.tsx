'use client'

import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { Trophy, TrendingUp, Target, Award, BarChart3 } from 'lucide-react'
import { AssessmentTypeBadge } from '@/components/student/AssessmentTypeIcon'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type TypeBreakdown = {
  type: string
  average: number
  earned: number
  possible: number
  count: number
}

type Grade = {
  id: string
  assessmentId: string
  assessmentTitle: string
  assessmentType: string
  score: number
  maxPoints: number
  percentage: number
  gradedAt: string | null
  feedback: string | null
}

type ClassSummary = {
  classId: string
  className: string
  classCode: string
  courseCode: string
  courseTitle: string
  earned: number
  possible: number
  count: number
  average: number
  grades: Grade[]
}

type GradesData = {
  student: {
    name: string
    email: string
  }
  overallStats: {
    average: number
    totalPointsEarned: number
    totalPointsPossible: number
    totalGradedAssignments: number
  }
  typeBreakdown: TypeBreakdown[]
  classSummary: ClassSummary[]
  allSubmissions: number
}

const COLORS = {
  INTERACTIVE_LESSON: 'rgb(139, 92, 246)', // accent-purple
  LAB: 'rgb(34, 197, 94)', // success (green)
  EXAM: 'rgb(239, 68, 68)', // error (red)
  QUIZ: 'rgb(251, 146, 60)', // warning (orange)
  DISCUSSION: 'rgb(59, 130, 246)', // info (blue)
}

const TYPE_NAMES = {
  INTERACTIVE_LESSON: 'Lessons',
  LAB: 'Labs',
  EXAM: 'Exams',
  QUIZ: 'Quizzes',
  DISCUSSION: 'Discussions',
}

const LAST_CLASS_STORAGE_KEY = 'student_last_viewed_class_grades'

export default function GradesPage() {
  const [data, setData] = useState<GradesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedClass, setSelectedClass] = useState<string>('')

  useEffect(() => {
    fetchGrades()
  }, [])

  // Auto-select first class when data loads
  useEffect(() => {
    if (!data || data.classSummary.length === 0) return

    // Priority 1: localStorage
    const savedClassId = localStorage.getItem(LAST_CLASS_STORAGE_KEY)
    if (savedClassId && data.classSummary.some((c) => c.classId === savedClassId)) {
      setSelectedClass(savedClassId)
      return
    }

    // Priority 2: First class (default)
    const firstClassId = data.classSummary[0].classId
    setSelectedClass(firstClassId)
    localStorage.setItem(LAST_CLASS_STORAGE_KEY, firstClassId)
  }, [data])

  const fetchGrades = async () => {
    try {
      const response = await fetch('/api/student/grades')
      if (response.ok) {
        const gradesData = await response.json()
        setData(gradesData)
      }
    } catch (error) {
      console.error('Error fetching grades:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center" style={{ minHeight: '50vh' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" role="status">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    )
  }

  if (!data || data.allSubmissions === 0) {
    return (
      <div>
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent-orange/10">
              <BarChart3 className="h-5 w-5 text-accent-orange" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-foreground-tertiary font-medium mb-0.5">Grade Report</p>
              <h1 className="text-2xl font-semibold text-foreground">
                {data?.student?.name || 'Student'}
              </h1>
            </div>
          </div>
          <p className="text-sm text-foreground-secondary ml-13">
            Track your academic performance and progress across all enrolled classes
          </p>
        </div>
        <Card className="p-8 text-center">
          <Award size={64} className="text-foreground-tertiary mb-3 mx-auto" />
          <h3 className="text-lg text-foreground-secondary font-semibold mb-2">No Graded Assignments Yet</h3>
          <p className="text-foreground-tertiary mb-0">
            Your grades will appear here once your instructor has graded your submissions.
          </p>
        </Card>
      </div>
    )
  }

  const getLetterGrade = (percentage: number): string => {
    if (percentage >= 93) return 'A'
    if (percentage >= 90) return 'A-'
    if (percentage >= 87) return 'B+'
    if (percentage >= 83) return 'B'
    if (percentage >= 80) return 'B-'
    if (percentage >= 77) return 'C+'
    if (percentage >= 73) return 'C'
    if (percentage >= 70) return 'C-'
    if (percentage >= 67) return 'D+'
    if (percentage >= 63) return 'D'
    if (percentage >= 60) return 'D-'
    return 'F'
  }

  const getGradeBadgeVariant = (percentage: number): "solid-success" | "solid-info" | "solid-warning" | "solid-error" | "default" => {
    if (percentage >= 90) return 'solid-success'
    if (percentage >= 80) return 'solid-info'
    if (percentage >= 70) return 'solid-warning'
    return 'solid-error'
  }

  const getProgressBarColor = (percentage: number): string => {
    if (percentage >= 90) return 'bg-success'
    if (percentage >= 80) return 'bg-info'
    if (percentage >= 70) return 'bg-warning'
    return 'bg-error'
  }

  const handleClassChange = (classId: string) => {
    setSelectedClass(classId)
    localStorage.setItem(LAST_CLASS_STORAGE_KEY, classId)
  }

  // Get current class data
  const currentClassData = data.classSummary.find(c => c.classId === selectedClass)

  // Calculate filtered stats based on selected class
  const filteredStats = currentClassData ? {
    average: currentClassData.average,
    totalPointsEarned: currentClassData.earned,
    totalPointsPossible: currentClassData.possible,
    totalGradedAssignments: currentClassData.count,
  } : data.overallStats

  // Calculate type breakdown for selected class only
  const typeBreakdownByClass: Record<string, { earned: number; possible: number; count: number }> = {}

  if (currentClassData) {
    currentClassData.grades.forEach(grade => {
      const type = grade.assessmentType
      if (!typeBreakdownByClass[type]) {
        typeBreakdownByClass[type] = { earned: 0, possible: 0, count: 0 }
      }
      if (grade.score !== null) {
        typeBreakdownByClass[type].earned += grade.score
        typeBreakdownByClass[type].possible += grade.maxPoints
        typeBreakdownByClass[type].count += 1
      }
    })
  }

  const filteredTypeBreakdown = Object.entries(typeBreakdownByClass).map(([type, data]) => ({
    type,
    average: data.possible > 0 ? (data.earned / data.possible) * 100 : 0,
    earned: data.earned,
    possible: data.possible,
    count: data.count,
  })).filter(item => item.count > 0)

  // Prepare pie chart data from filtered type breakdown
  const pieChartData = filteredTypeBreakdown.map(item => ({
    name: TYPE_NAMES[item.type as keyof typeof TYPE_NAMES],
    value: item.average,
    count: item.count,
    earned: item.earned,
    possible: item.possible,
    color: COLORS[item.type as keyof typeof COLORS],
  }))

  return (
    <div>
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent-orange/10">
            <BarChart3 className="h-5 w-5 text-accent-orange" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-foreground-tertiary font-medium mb-0.5">Grade Report</p>
            <h1 className="text-2xl font-semibold text-foreground">
              {data.student.name}
            </h1>
          </div>
        </div>
        <p className="text-sm text-foreground-secondary ml-13">
          Track your academic performance and progress for your classes
        </p>
      </div>

      {/* Class Selector */}
      <Card className="mb-4 border-l-4 border-l-accent-purple">
        <div className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="text-sm text-muted-foreground mb-1">Viewing Grades For:</div>
              {currentClassData && (
                <div>
                  <div className="text-lg font-semibold text-foreground">
                    {currentClassData.courseCode} - {currentClassData.courseTitle}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {currentClassData.classCode}
                  </div>
                </div>
              )}
            </div>
            <div className="w-64">
              <select
                className="input-base w-full"
                value={selectedClass}
                onChange={(e) => handleClassChange(e.target.value)}
              >
                {data.classSummary.map((classData) => (
                  <option key={classData.classId} value={classData.classId}>
                    {classData.courseCode} • {classData.classCode}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Overall Statistics Cards - Compact */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2">
        <Card className="p-2 border-l-4 border-l-accent-orange hover:border-border transition-none">
          <div className="flex items-center justify-between mb-1">
            <small className="text-foreground-tertiary text-xs">Class Average</small>
            <Trophy className="text-accent-orange" size={12} />
          </div>
          <h5 className="text-xl font-semibold mb-2">{filteredStats.average.toFixed(1)}%</h5>
          <Badge variant={getGradeBadgeVariant(filteredStats.average)} className="grade">
            {getLetterGrade(filteredStats.average)}
          </Badge>
        </Card>

        <Card className="p-2 border-l-4 border-l-success hover:border-border transition-none">
          <div className="flex items-center justify-between mb-1">
            <small className="text-foreground-tertiary text-xs">Points</small>
            <Target className="text-success" size={12} />
          </div>
          <h5 className="text-xl font-semibold mb-0">{filteredStats.totalPointsEarned.toFixed(0)}</h5>
          <small className="text-foreground-tertiary text-xs">/ {filteredStats.totalPointsPossible.toFixed(0)}</small>
        </Card>

        <Card className="p-2 border-l-4 border-l-warning hover:border-border transition-none">
          <div className="flex items-center justify-between mb-1">
            <small className="text-foreground-tertiary text-xs">Graded</small>
            <TrendingUp className="text-warning" size={12} />
          </div>
          <h5 className="text-xl font-semibold mb-0">{filteredStats.totalGradedAssignments}</h5>
          <small className="text-foreground-tertiary text-xs">Completed</small>
        </Card>

        <Card className="p-2 border-l-4 border-l-info hover:border-border transition-none">
          <div className="flex items-center justify-between mb-1">
            <small className="text-foreground-tertiary text-xs">Assignment Types</small>
            <Award className="text-info" size={12} />
          </div>
          <h5 className="text-xl font-semibold mb-0">{filteredTypeBreakdown.length}</h5>
          <small className="text-foreground-tertiary text-xs">Types</small>
        </Card>
      </div>

      {/* Grade Breakdown by Assessment Type - Compact */}
      {filteredTypeBreakdown.length > 0 && (
        <Card className="mb-2">
          <CardHeader className="py-2 px-3">
            <CardTitle className="text-sm">
              📊 Grade Breakdown by Assessment Type
            </CardTitle>
          </CardHeader>
          <div className="p-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {/* Left: Pie Chart */}
              <div>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="45%"
                      outerRadius={70}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: string, props: any) => [
                        `${value.toFixed(1)}% (${props.payload.earned}/${props.payload.possible} pts)`,
                        name
                      ]}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                      wrapperStyle={{
                        fontSize: '11px',
                        paddingTop: '8px',
                        color: 'rgb(115, 115, 115)'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Right: Performance Breakdown */}
              <div>
                <h6 className="font-bold mb-2 text-sm">Performance by Type</h6>
                <div className="flex flex-col gap-2">
                  {filteredTypeBreakdown.map((item) => {
                    const typeColor = COLORS[item.type as keyof typeof COLORS]
                    const typeName = TYPE_NAMES[item.type as keyof typeof TYPE_NAMES]
                    return (
                      <div key={item.type}>
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-sm"
                              style={{ backgroundColor: typeColor }}
                            ></div>
                            <span className="font-semibold text-xs">{typeName}</span>
                          </div>
                          <span className="text-gray-500 text-xs">
                            {item.count} assignment{item.count !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1">
                          <div
                            className="h-1.5 rounded-full"
                            style={{
                              width: `${item.average}%`,
                              backgroundColor: typeColor,
                            }}
                          ></div>
                        </div>
                        <div className="flex justify-between">
                          <small className="text-gray-500 text-xs">
                            {item.earned.toFixed(0)} / {item.possible.toFixed(0)} pts
                          </small>
                          <small className="font-semibold text-xs">
                            {item.average.toFixed(1)}%
                          </small>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Grades Table */}
      {currentClassData && (
        <div className="mb-3 rounded-xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="bg-accent-purple/5 px-6 py-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-2xl font-semibold text-foreground mb-2">{currentClassData.classCode}</h3>
                <p className="text-base text-foreground-secondary">{currentClassData.courseTitle}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-lg">{currentClassData.average.toFixed(1)}%</span>
                <Badge variant={getGradeBadgeVariant(currentClassData.average)} className="grade">
                  {getLetterGrade(currentClassData.average)}
                </Badge>
              </div>
            </div>
            <p className="text-xs text-foreground-tertiary">
              {currentClassData.count} graded assignment{currentClassData.count !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border hover:bg-transparent">
                  <TableHead className="normal-case tracking-normal h-12 bg-transparent pl-6">Assignment</TableHead>
                  <TableHead className="normal-case tracking-normal h-12 bg-transparent">Type</TableHead>
                  <TableHead className="text-right normal-case tracking-normal h-12 bg-transparent">Score</TableHead>
                  <TableHead className="text-right normal-case tracking-normal h-12 bg-transparent">Percentage</TableHead>
                  <TableHead className="text-center normal-case tracking-normal h-12 bg-transparent">Grade</TableHead>
                  <TableHead className="normal-case tracking-normal h-12 bg-transparent pr-6">Graded</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentClassData.grades.map((grade) => (
                  <TableRow key={grade.id} className="hover:bg-background-secondary/50">
                    <TableCell className="pl-6 py-4">
                      <div className="font-semibold text-sm text-foreground min-w-[250px]">{grade.assessmentTitle}</div>
                      {grade.feedback && (
                        <div className="text-foreground-tertiary text-xs mt-1">
                          💬 Feedback available
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="py-4">
                      <AssessmentTypeBadge type={grade.assessmentType as any} />
                    </TableCell>
                    <TableCell className="text-right py-4">
                      <span className="font-mono font-semibold text-sm tabular-nums">
                        {grade.score !== null ? grade.score.toFixed(1) : '—'} / {grade.maxPoints.toFixed(0)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right py-4">
                      <span className="font-mono font-bold text-base tabular-nums">
                        {grade.percentage !== null ? grade.percentage.toFixed(1) : '—'}%
                      </span>
                    </TableCell>
                    <TableCell className="text-center py-4">
                      <div className="flex justify-center">
                        <Badge
                          variant={grade.percentage !== null ? getGradeBadgeVariant(grade.percentage) : 'default'}
                          className="grade"
                        >
                          {grade.percentage !== null ? getLetterGrade(grade.percentage) : 'N/A'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="pr-6 py-4">
                      <span className="text-foreground-tertiary text-xs">
                        {grade.gradedAt
                          ? new Date(grade.gradedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : 'N/A'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow className="hover:bg-background-secondary">
                  <TableCell colSpan={2} className="font-bold text-sm pl-6 py-4">Class Average</TableCell>
                  <TableCell className="text-right font-mono font-bold text-sm py-4 tabular-nums">
                    {currentClassData.earned.toFixed(1)} / {currentClassData.possible.toFixed(1)}
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-base py-4 tabular-nums">
                    {currentClassData.average.toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-center py-4">
                    <div className="flex justify-center">
                      <Badge variant={getGradeBadgeVariant(currentClassData.average)} className="grade">
                        {getLetterGrade(currentClassData.average)}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="pr-6"></TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </div>
      )}
    </div>
  )
}
