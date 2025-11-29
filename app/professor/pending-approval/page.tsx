import { Clock, Mail, CheckCircle, GraduationCap, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { getProfessorUnapproved } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { LogoutButton } from '@/components/logout-button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default async function PendingApprovalPage() {
  const professor = await getProfessorUnapproved()

  if (!professor) {
    redirect('/sign-in')
  }

  // If already approved, redirect to professor dashboard
  if (professor.isApproved) {
    redirect('/professor')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Header */}
      <nav className="bg-background border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-accent-purple" />
            <span className="font-bold text-foreground">CS Learning Platform</span>
          </Link>
          <div>
            <LogoutButton />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-lg">
            <CardHeader className="bg-error text-white rounded-t-lg -mx-6 -mt-6 px-6 pt-6 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Clock size={32} />
                  <div>
                    <h1 className="text-xl font-bold mb-1">Account Inactive</h1>
                    <p className="text-sm opacity-90">Your professor account has been deactivated</p>
                  </div>
                </div>
                <Badge variant="solid-error" className="border-2 border-white">Inactive</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* What happens next */}
              <Card className="bg-muted">
                <CardContent className="p-4">
                  <h2 className="font-bold mb-4">Why is my account inactive?</h2>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <CheckCircle size={18} className="text-muted-foreground mt-1 flex-shrink-0" />
                      <span className="text-sm">Your account has been temporarily deactivated by an administrator</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle size={18} className="text-muted-foreground mt-1 flex-shrink-0" />
                      <span className="text-sm">Contact your administrator for more information</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle size={18} className="text-muted-foreground mt-1 flex-shrink-0" />
                      <span className="text-sm">Once reactivated, you'll regain full access to your classes and students</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Account Details */}
              <Card className="border-l-4 border-l-accent-purple bg-accent-purple/10">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Mail size={20} className="text-accent-purple mt-1 flex-shrink-0" />
                    <div className="space-y-2">
                      <p className="font-bold text-accent-purple">Account Details</p>
                      <p className="text-sm">
                        <strong>Email:</strong> {professor.email}
                      </p>
                      <p className="text-sm">
                        <strong>Name:</strong> {professor.fullName || 'Not provided'}
                      </p>
                      <p className="text-sm">
                        <strong>School ID:</strong> {professor.usernameSchoolId || 'Not set'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Next Steps */}
              <div>
                <p className="font-semibold text-sm mb-2">What should I do?</p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Contact your system administrator for assistance</li>
                  <li>Ask about the reason for deactivation</li>
                  <li>Request reactivation if this was done in error</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button asChild variant="outline" className="flex-1">
                  <Link href="/">Return to Home</Link>
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  variant="default"
                  className="flex-1 bg-error hover:bg-error/90"
                >
                  Check Status
                </Button>
              </div>

              {/* Support */}
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Need help? Contact your administrator or support at support@cslearning.edu
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
