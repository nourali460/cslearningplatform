"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GraduationCap, AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403 && data.needsApproval) {
          setError(
            "Your professor account is pending admin approval. Please wait for approval before signing in."
          );
        } else {
          setError(data.error || "Invalid email or password");
        }
        setIsLoading(false);
        return;
      }

      // Login successful - redirect based on role
      const userRole = data.user.role;
      if (userRole === "admin") {
        router.push("/admin");
      } else if (userRole === "professor") {
        router.push("/professor");
      } else if (userRole === "student") {
        router.push("/student");
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container-claude">
          <div className="flex items-center justify-between h-16">
            <Link
              href="/"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <GraduationCap className="h-6 w-6 text-accent-orange" />
              <span className="font-semibold text-lg text-foreground">
                CS Learning Platform
              </span>
            </Link>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          {/* Title */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Sign In
            </h1>
            <p className="text-foreground-secondary">
              Enter your credentials to continue
            </p>
          </div>

          {/* Form */}
          <div className="bg-card border border-border rounded-xl p-8 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  disabled={isLoading}
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  disabled={isLoading}
                />
              </div>

              {/* Error Alert */}
              {error && (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-error/10 border border-error/20 text-error animate-slide-down">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            {/* Sign Up Link */}
            <div className="text-center pt-4 border-t border-border">
              <p className="text-sm text-foreground-secondary">
                Don't have an account?{" "}
                <Link
                  href="/sign-up"
                  className="text-accent-orange hover:text-accent-orange-hover font-medium transition-colors"
                >
                  Sign up here
                </Link>
              </p>
            </div>
          </div>

          {/* Footer Note */}
          <p className="text-center text-sm text-foreground-tertiary">
            Forgot your password? Contact your system administrator for a
            password reset.
          </p>
        </div>
      </main>
    </div>
  );
}
