import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { BookOpen, Users, GraduationCap, CheckCircle, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TopNav } from "@/components/navigation/TopNav";

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <TopNav />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-background via-background-secondary to-background pt-20 pb-32">
        <div className="container-claude">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-accent-orange/10 px-4 py-2 text-sm text-accent-orange animate-fade-in">
              <Sparkles className="h-4 w-4" />
              <span>The modern way to learn computer science</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-semibold tracking-tight text-foreground mb-6 animate-slide-up">
              Master Computer Science
              <span className="block mt-2 gradient-text">One Course at a Time</span>
            </h1>
            <p className="text-xl text-foreground-secondary leading-relaxed mb-10 max-w-2xl mx-auto">
              A comprehensive learning platform designed for computer science students and educators.
              Track your progress, submit assignments, and excel in your courses.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <Button size="lg" asChild className="group">
                  <Link href="/dashboard">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button size="lg" asChild className="group">
                    <Link href="/sign-up">
                      Start Learning Free
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link href="/sign-in">Sign In</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 -z-10 h-96 w-96 rounded-full bg-accent-orange/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 -z-10 h-96 w-96 rounded-full bg-accent-purple/5 blur-3xl" />
      </section>

      {/* Features Section */}
      <section className="py-24 bg-background">
        <div className="container-claude">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-semibold tracking-tight text-foreground mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-lg text-foreground-secondary max-w-2xl mx-auto">
              Powerful tools for students, professors, and administrators.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Student Card */}
            <div className="group bg-card border border-border rounded-xl p-8 transition-all hover:border-border-secondary hover:shadow-md">
              <div className="mb-6 inline-flex items-center justify-center w-12 h-12 rounded-lg bg-accent-orange/10 text-accent-orange">
                <BookOpen className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">For Students</h3>
              <p className="text-sm text-foreground-secondary mb-6">
                Access all your courses in one place
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground-secondary">
                    Enroll in classes with a simple class code
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground-secondary">
                    Submit assignments and track grades
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground-secondary">
                    View upcoming assessments and deadlines
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground-secondary">
                    Monitor your academic progress
                  </span>
                </li>
              </ul>
            </div>

            {/* Professor Card */}
            <div className="group bg-card border border-border rounded-xl p-8 transition-all hover:border-border-secondary hover:shadow-md">
              <div className="mb-6 inline-flex items-center justify-center w-12 h-12 rounded-lg bg-accent-purple/10 text-accent-purple">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">For Professors</h3>
              <p className="text-sm text-foreground-secondary mb-6">
                Manage your classes efficiently
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground-secondary">
                    Create and manage class sections
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground-secondary">
                    Share class codes for easy enrollment
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground-secondary">
                    Create assessments and grade submissions
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground-secondary">
                    Track student progress and engagement
                  </span>
                </li>
              </ul>
            </div>

            {/* Admin Card */}
            <div className="group bg-card border border-border rounded-xl p-8 transition-all hover:border-border-secondary hover:shadow-md md:col-span-2 lg:col-span-1">
              <div className="mb-6 inline-flex items-center justify-center w-12 h-12 rounded-lg bg-info/10 text-info">
                <GraduationCap className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">For Admins</h3>
              <p className="text-sm text-foreground-secondary mb-6">
                Oversee the entire platform
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground-secondary">
                    Manage users, courses, and classes
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground-secondary">
                    Approve professor accounts
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground-secondary">
                    View platform-wide analytics
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground-secondary">
                    Advanced filtering and reporting
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-background-secondary border-t border-border">
        <div className="container-claude">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-4xl font-semibold tracking-tight text-foreground mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-foreground-secondary mb-8">
              Join thousands of students and educators using our platform to achieve their academic goals.
            </p>
            <Button size="lg" asChild className="group">
              <Link href="/sign-up">
                Create Your Account
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 bg-background">
        <div className="container-claude">
          <div className="text-center space-y-4">
            <p className="text-sm text-foreground-secondary">
              &copy; 2025 CS Learning Platform. All rights reserved.
            </p>
            <Link
              href="/admin-login"
              className="text-sm text-foreground-secondary hover:text-foreground transition-colors inline-block"
            >
              Administrator Login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
