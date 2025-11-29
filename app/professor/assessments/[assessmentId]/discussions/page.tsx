'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, MessageSquare, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DiscussionPostCard } from '@/components/professor/DiscussionPostCard'
import { DiscussionGradingPanel } from '@/components/professor/DiscussionGradingPanel'

interface DiscussionReply {
  id: string
  content: string
  createdAt: string
  author: {
    id: string
    fullName: string
    email: string
  }
}

interface DiscussionPost {
  id: string
  content: string
  createdAt: string
  isPinned: boolean
  likeCount: number
  student: {
    id: string
    fullName: string
    email: string
  }
  replies: DiscussionReply[]
  _count: {
    replies: number
  }
}

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

export default function AssessmentDiscussionsPage() {
  const params = useParams()
  const router = useRouter()
  const assessmentId = params?.assessmentId as string

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [posts, setPosts] = useState<DiscussionPost[]>([])
  const [stats, setStats] = useState<DiscussionStats | null>(null)
  const [assessment, setAssessment] = useState<any>(null)

  useEffect(() => {
    if (assessmentId) {
      fetchDiscussions()
      fetchStats()
    }
  }, [assessmentId])

  const fetchDiscussions = async () => {
    if (!assessmentId) return

    try {
      const response = await fetch(`/api/professor/assessments/${assessmentId}/discussions`)
      if (response.ok) {
        const data = await response.json()
        setPosts(data.posts || [])
        setAssessment(data.assessment)
      } else {
        console.error('Failed to fetch discussions')
      }
    } catch (error) {
      console.error('Error fetching discussions:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    if (!assessmentId) return

    try {
      const response = await fetch(`/api/professor/assessments/${assessmentId}/discussions/stats`)
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchDiscussions()
    await fetchStats()
    setRefreshing(false)
  }

  const handleTogglePin = async (postId: string) => {
    try {
      const response = await fetch(`/api/professor/discussions/${postId}/pin`, {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        // Update post in local state
        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post.id === postId ? { ...post, isPinned: data.isPinned } : post
          )
        )
      } else {
        alert('Failed to toggle pin')
      }
    } catch (error) {
      console.error('Error toggling pin:', error)
      alert('Failed to toggle pin')
    }
  }

  const handleAutoGrade = async () => {
    if (!assessmentId) return

    const response = await fetch(`/api/professor/assessments/${assessmentId}/discussions/grade`, {
      method: 'POST',
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to auto-grade')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/professor/assessments')}
          className="mb-4"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to Assessments
        </Button>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-accent-purple" />
            <div>
              <h1 className="text-3xl font-bold">{assessment?.title || 'Discussion'}</h1>
              <p className="text-muted-foreground">
                Manage discussion posts and grade student participation
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw size={16} className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Panel */}
      {stats && (
        <div className="mb-6">
          <DiscussionGradingPanel
            stats={stats}
            onAutoGrade={handleAutoGrade}
            onRefresh={handleRefresh}
          />
        </div>
      )}

      {/* Discussion Posts */}
      <Card>
        <CardHeader>
          <CardTitle>Discussion Posts</CardTitle>
          <CardDescription>
            {posts.length} post{posts.length !== 1 ? 's' : ''}
            {stats && ` • ${stats.studentsWithPosts} / ${stats.totalStudents} students participated`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
              <p className="text-muted-foreground">
                Students haven't started posting to this discussion yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <DiscussionPostCard
                  key={post.id}
                  post={post}
                  onTogglePin={handleTogglePin}
                  minimumReplyCount={stats?.assessment.minimumReplyCount || 1}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
