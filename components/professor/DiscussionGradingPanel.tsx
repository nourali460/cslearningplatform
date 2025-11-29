'use client'

import { useState } from 'react'
import {
  MessageSquare,
  Users,
  CheckCircle,
  Clock,
  TrendingUp,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface DiscussionStats {
  totalStudents: number
  totalPosts: number
  totalReplies: number
  studentsWithPosts: number
  participationRate: number
  submittedCount: number
  gradedCount: number
  ungradedCount: number
  averageScore: number | null
  pinnedPosts: number
  assessment: {
    id: string
    title: string
    maxPoints: number
    minimumReplyCount: number | null
    autoCompleteEnabled: boolean | null
  }
}

interface DiscussionGradingPanelProps {
  stats: DiscussionStats
  onAutoGrade: () => Promise<void>
  onRefresh: () => void
}

export function DiscussionGradingPanel({
  stats,
  onAutoGrade,
  onRefresh,
}: DiscussionGradingPanelProps) {
  const [isGrading, setIsGrading] = useState(false)

  const handleAutoGrade = async () => {
    if (!confirm('Auto-grade all submissions based on completion criteria?')) {
      return
    }

    setIsGrading(true)
    try {
      await onAutoGrade()
      alert('Submissions auto-graded successfully')
      onRefresh()
    } catch (error) {
      console.error('Error auto-grading:', error)
      alert('Failed to auto-grade submissions')
    } finally {
      setIsGrading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Participation Stats */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Users size={16} />
            Participation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Students Posted</span>
              <span className="font-bold">
                {stats.studentsWithPosts}/{stats.totalStudents}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Rate</span>
              <Badge variant={stats.participationRate >= 75 ? 'success' : 'warning'}>
                {stats.participationRate.toFixed(0)}%
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Stats */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <MessageSquare size={16} />
            Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Posts</span>
              <span className="font-bold">{stats.totalPosts}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Replies</span>
              <span className="font-bold">{stats.totalReplies}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grading Stats */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <CheckCircle size={16} />
            Grading
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Graded</span>
              <span className="font-bold">{stats.gradedCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Ungraded</span>
              <Badge variant={stats.ungradedCount > 0 ? 'warning' : 'success'}>
                {stats.ungradedCount}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Average Score */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp size={16} />
            Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Avg Score</span>
              <span className="font-bold">
                {stats.averageScore !== null
                  ? `${stats.averageScore.toFixed(1)}/${stats.assessment.maxPoints}`
                  : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Min Replies</span>
              <span className="font-bold">
                {stats.assessment.minimumReplyCount || 0}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Auto-Grade Action */}
      {stats.assessment.autoCompleteEnabled && stats.ungradedCount > 0 && (
        <Card className="md:col-span-2 lg:col-span-4">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold mb-1">Auto-Grade Submissions</h4>
                <p className="text-sm text-muted-foreground">
                  Automatically grade {stats.ungradedCount} ungraded submission
                  {stats.ungradedCount !== 1 ? 's' : ''} based on post and reply
                  requirements ({stats.assessment.minimumReplyCount || 0} replies minimum)
                </p>
              </div>
              <Button
                onClick={handleAutoGrade}
                disabled={isGrading}
                className="ml-4"
              >
                {isGrading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Grading...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Auto-Grade All
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
