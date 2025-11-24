'use client'

import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { Trophy, TrendingUp, Target, Award } from 'lucide-react'
import { AssessmentTypeIcon, AssessmentTypeBadge } from '@/components/student/AssessmentTypeIcon'

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
  INTERACTIVE_LESSON: '#0d6efd', // Blue
  LAB: '#198754', // Green
  EXAM: '#dc3545', // Red
  QUIZ: '#ffc107', // Yellow
  DISCUSSION: '#0dcaf0', // Cyan
}

const TYPE_NAMES = {
  INTERACTIVE_LESSON: 'Lessons',
  LAB: 'Labs',
  EXAM: 'Exams',
  QUIZ: 'Quizzes',
  DISCUSSION: 'Discussions',
}

export default function GradesPage() {
  const [data, setData] = useState<GradesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedClass, setSelectedClass] = useState<string | 'all'>('all')

  useEffect(() => {
    fetchGrades()
  }, [])

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
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  if (!data || data.allSubmissions === 0) {
    return (
      <div>
        <div className="mb-4">
          <h1 className="display-5 fw-bold text-primary mb-2">📊 My Grades</h1>
          <p className="text-muted lead">Track your academic performance</p>
        </div>
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center py-5">
            <Award size={64} className="text-muted mb-3" />
            <h3 className="h5 text-muted">No Graded Assignments Yet</h3>
            <p className="text-muted mb-0">
              Your grades will appear here once your instructor has graded your submissions.
            </p>
          </div>
        </div>
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

  const getGradeColor = (percentage: number): string => {
    if (percentage >= 90) return 'success'
    if (percentage >= 80) return 'primary'
    if (percentage >= 70) return 'warning'
    if (percentage >= 60) return 'orange'
    return 'danger'
  }

  const getProgressBarColor = (percentage: number): string => {
    if (percentage >= 90) return 'bg-success'
    if (percentage >= 80) return 'bg-primary'
    if (percentage >= 70) return 'bg-warning'
    return 'bg-danger'
  }

  // Prepare pie chart data
  const pieChartData = data.typeBreakdown.map(item => ({
    name: TYPE_NAMES[item.type as keyof typeof TYPE_NAMES],
    value: item.average,
    count: item.count,
    earned: item.earned,
    possible: item.possible,
    color: COLORS[item.type as keyof typeof COLORS],
  }))

  const filteredClasses = selectedClass === 'all'
    ? data.classSummary
    : data.classSummary.filter(c => c.classId === selectedClass)

  return (
    <div>
      {/* Header */}
      <div className="mb-4">
        <h1 className="display-5 fw-bold text-primary mb-2">📊 My Grades</h1>
        <p className="text-muted lead">Track your academic performance across all classes</p>
      </div>

      {/* Overall Statistics Cards */}
      <div className="row g-4 mb-4">
        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100" style={{ borderLeft: '4px solid #0d6efd' }}>
            <div className="card-body">
              <div className="d-flex align-items-center mb-2">
                <Trophy className="text-primary me-2" size={20} />
                <h6 className="card-subtitle text-muted mb-0">Overall Average</h6>
              </div>
              <h2 className="card-title mb-1">
                {data.overallStats.average.toFixed(1)}%
              </h2>
              <p className="card-text small mb-2">
                <span className={`badge bg-${getGradeColor(data.overallStats.average)}`}>
                  {getLetterGrade(data.overallStats.average)}
                </span>
              </p>
              <div className="progress" style={{ height: '8px' }}>
                <div
                  className={`progress-bar ${getProgressBarColor(data.overallStats.average)}`}
                  role="progressbar"
                  style={{ width: `${data.overallStats.average}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100" style={{ borderLeft: '4px solid #198754' }}>
            <div className="card-body">
              <div className="d-flex align-items-center mb-2">
                <Target className="text-success me-2" size={20} />
                <h6 className="card-subtitle text-muted mb-0">Points Earned</h6>
              </div>
              <h2 className="card-title mb-1">
                {data.overallStats.totalPointsEarned.toFixed(1)}
              </h2>
              <p className="card-text small text-muted mb-0">
                of {data.overallStats.totalPointsPossible.toFixed(1)} possible
              </p>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100" style={{ borderLeft: '4px solid #ffc107' }}>
            <div className="card-body">
              <div className="d-flex align-items-center mb-2">
                <TrendingUp className="text-warning me-2" size={20} />
                <h6 className="card-subtitle text-muted mb-0">Graded Assignments</h6>
              </div>
              <h2 className="card-title mb-1">{data.overallStats.totalGradedAssignments}</h2>
              <p className="card-text small text-muted mb-0">Completed & graded</p>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100" style={{ borderLeft: '4px solid #0dcaf0' }}>
            <div className="card-body">
              <div className="d-flex align-items-center mb-2">
                <Award className="text-info me-2" size={20} />
                <h6 className="card-subtitle text-muted mb-0">Classes</h6>
              </div>
              <h2 className="card-title mb-1">{data.classSummary.length}</h2>
              <p className="card-text small text-muted mb-0">With graded work</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pie Chart Section */}
      {data.typeBreakdown.length > 0 && (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-header bg-white border-bottom">
            <h5 className="card-title mb-0 fw-bold">
              <i className="bi bi-pie-chart-fill text-primary me-2"></i>
              Grade Breakdown by Assessment Type
            </h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                      outerRadius={100}
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
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="col-md-6">
                <h6 className="fw-bold mb-3">Performance by Type</h6>
                <div className="d-flex flex-column gap-3">
                  {data.typeBreakdown.map((item) => (
                    <div key={item.type}>
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <div className="d-flex align-items-center">
                          <AssessmentTypeIcon type={item.type as any} size={18} />
                          <span className="fw-semibold ms-1">
                            {TYPE_NAMES[item.type as keyof typeof TYPE_NAMES]}
                          </span>
                          <span className="badge bg-secondary ms-2 small">{item.count}</span>
                        </div>
                        <div>
                          <span className="fw-bold">{item.average.toFixed(1)}%</span>
                          <span className={`badge bg-${getGradeColor(item.average)} ms-2`}>
                            {getLetterGrade(item.average)}
                          </span>
                        </div>
                      </div>
                      <div className="progress" style={{ height: '12px' }}>
                        <div
                          className={`progress-bar ${getProgressBarColor(item.average)}`}
                          role="progressbar"
                          style={{ width: `${item.average}%` }}
                        ></div>
                      </div>
                      <small className="text-muted">
                        {item.earned.toFixed(1)} / {item.possible.toFixed(1)} points
                      </small>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Class Filter */}
      <div className="mb-3">
        <select
          className="form-select"
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          style={{ maxWidth: '400px' }}
        >
          <option value="all">All Classes</option>
          {data.classSummary.map((classData) => (
            <option key={classData.classId} value={classData.classId}>
              {classData.classCode} - {classData.courseTitle}
            </option>
          ))}
        </select>
      </div>

      {/* Grades by Class */}
      {filteredClasses.map((classData) => (
        <div key={classData.classId} className="card border-0 shadow-sm mb-4">
          <div className="card-header bg-primary text-white">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h5 className="card-title mb-1 fw-bold">
                  <code className="text-white">{classData.classCode}</code> {classData.courseTitle}
                </h5>
                <p className="mb-0 small opacity-90">
                  {classData.count} graded assignment{classData.count !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="text-end">
                <div className="h3 mb-0">{classData.average.toFixed(1)}%</div>
                <span className={`badge bg-${getGradeColor(classData.average)} bg-opacity-75`}>
                  {getLetterGrade(classData.average)}
                </span>
              </div>
            </div>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="bg-light">
                  <tr>
                    <th className="py-3">Assignment</th>
                    <th className="py-3">Type</th>
                    <th className="py-3 text-end">Score</th>
                    <th className="py-3 text-end">Percentage</th>
                    <th className="py-3 text-end">Grade</th>
                    <th className="py-3">Graded</th>
                  </tr>
                </thead>
                <tbody>
                  {classData.grades.map((grade) => (
                    <tr key={grade.id}>
                      <td className="py-3">
                        <div className="fw-semibold">{grade.assessmentTitle}</div>
                        {grade.feedback && (
                          <small className="text-muted">
                            <i className="bi bi-chat-left-text me-1"></i>
                            Feedback available
                          </small>
                        )}
                      </td>
                      <td className="py-3">
                        <AssessmentTypeBadge type={grade.assessmentType as any} />
                      </td>
                      <td className="py-3 text-end">
                        <span className="fw-semibold">
                          {grade.score.toFixed(1)} / {grade.maxPoints.toFixed(0)}
                        </span>
                      </td>
                      <td className="py-3 text-end">
                        <div className="d-flex align-items-center justify-content-end gap-2">
                          <div className="progress flex-grow-1" style={{ height: '8px', maxWidth: '100px' }}>
                            <div
                              className={`progress-bar ${getProgressBarColor(grade.percentage)}`}
                              role="progressbar"
                              style={{ width: `${grade.percentage}%` }}
                            ></div>
                          </div>
                          <span className="fw-semibold">{grade.percentage.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="py-3 text-end">
                        <span className={`badge bg-${getGradeColor(grade.percentage)} fs-6 px-3`}>
                          {getLetterGrade(grade.percentage)}
                        </span>
                      </td>
                      <td className="py-3">
                        <small className="text-muted">
                          {grade.gradedAt
                            ? new Date(grade.gradedAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : 'N/A'}
                        </small>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-light">
                  <tr>
                    <td colSpan={2} className="py-3 fw-bold">Class Average</td>
                    <td className="py-3 text-end fw-bold">
                      {classData.earned.toFixed(1)} / {classData.possible.toFixed(1)}
                    </td>
                    <td className="py-3 text-end fw-bold">
                      {classData.average.toFixed(1)}%
                    </td>
                    <td className="py-3 text-end">
                      <span className={`badge bg-${getGradeColor(classData.average)} fs-6 px-3`}>
                        {getLetterGrade(classData.average)}
                      </span>
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
