"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  GraduationCap,
  Users,
  ArrowLeft,
  CheckCircle,
  Copy,
  AlertCircle,
  Loader2,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Role = "student" | "professor" | null;

export default function SignUpPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<Role>(null);
  const [step, setStep] = useState<
    "role" | "classCode" | "register" | "success"
  >("role");

  // Form fields
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [usernameSchoolId, setUsernameSchoolId] = useState("");
  const [classCode, setClassCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI state
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [copiedPassword, setCopiedPassword] = useState(false);

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    if (role === "student") {
      setStep("classCode");
    } else if (role === "professor") {
      setStep("register");
    }
  };

  const handleClassCodeContinue = async () => {
    if (!classCode.trim()) {
      setError("Please enter a class code");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/validate-class-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classCode: classCode.trim().toUpperCase() }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Invalid class code");
        setIsLoading(false);
        return;
      }

      setStep("register");
      setIsLoading(false);
    } catch (error) {
      setError("Failed to validate class code. Please try again.");
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!usernameSchoolId.trim()) {
      setError("School ID is required");
      setIsLoading(false);
      return;
    }

    const schoolIdNum = parseInt(usernameSchoolId.trim(), 10);
    if (isNaN(schoolIdNum) || schoolIdNum < 0 || schoolIdNum > 1000000) {
      setError("School ID must be a number between 0 and 1000000");
      setIsLoading(false);
      return;
    }

    // Validate password for students
    if (selectedRole === "student") {
      if (password.length < 6) {
        setError("Password must be at least 6 characters");
        setIsLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match");
        setIsLoading(false);
        return;
      }
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          fullName: fullName.trim(),
          role: selectedRole,
          usernameSchoolId: usernameSchoolId.trim(),
          password: selectedRole === "student" ? password.trim() : undefined,
          classCode:
            selectedRole === "student"
              ? classCode.trim().toUpperCase()
              : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Registration failed");
        setIsLoading(false);
        return;
      }

      // Only set generated password for professors
      if (selectedRole === "professor" && data.user.password) {
        setGeneratedPassword(data.user.password);
      }
      setStep("success");
      setIsLoading(false);
    } catch (error) {
      console.error("Registration error:", error);
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(generatedPassword);
    setCopiedPassword(true);
    setTimeout(() => setCopiedPassword(false), 2000);
  };

  const handleContinueToSignIn = () => {
    router.push("/sign-in");
  };

  // Success screen
  if (step === "success") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
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
            </div>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-lg space-y-6">
            <div className="bg-card border border-border rounded-xl p-8 space-y-6">
              {/* Success Icon */}
              <div className="flex justify-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/10">
                  <CheckCircle className="h-8 w-8 text-success" />
                </div>
              </div>

              {/* Title */}
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-semibold text-foreground">
                  Account Created Successfully!
                </h1>
                <p className="text-foreground-secondary">
                  {selectedRole === "professor"
                    ? "Your professor account is pending admin approval."
                    : "Your account has been created. You can now sign in with your password."}
                </p>
              </div>

              {/* Generated Password (Professors Only) */}
              {selectedRole === "professor" && generatedPassword && (
                <div className="bg-background-secondary rounded-lg p-6 space-y-3">
                  <Label className="text-xs text-foreground-tertiary uppercase tracking-wide">
                    Your Generated Password
                  </Label>
                  <div className="flex items-center justify-between gap-4">
                    <code className="text-2xl font-mono font-bold text-accent-orange tracking-widest">
                      {generatedPassword}
                    </code>
                    <Button
                      variant={copiedPassword ? "success" : "outline"}
                      size="sm"
                      onClick={handleCopyPassword}
                    >
                      {copiedPassword ? (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="mr-2 h-4 w-4" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Warning (Professors Only) */}
              {selectedRole === "professor" && generatedPassword && (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-warning/10 border border-warning/20 text-warning">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <strong className="font-semibold">Important:</strong> Save
                    this password now! You'll need it to sign in.
                  </div>
                </div>
              )}

              {/* Account Details */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-foreground-tertiary">Email:</span>
                  <span className="text-foreground font-medium">{email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground-tertiary">Role:</span>
                  <span className="text-foreground font-medium">
                    {selectedRole === "professor" ? "Professor" : "Student"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground-tertiary">School ID:</span>
                  <span className="text-foreground font-medium">
                    {usernameSchoolId}
                  </span>
                </div>
              </div>

              {/* Continue Button */}
              <Button
                className="w-full"
                size="lg"
                onClick={handleContinueToSignIn}
                disabled={selectedRole === "professor"}
              >
                {selectedRole === "professor"
                  ? "Awaiting Admin Approval"
                  : "Continue to Sign In"}
              </Button>

              {selectedRole === "professor" && (
                <p className="text-center text-sm text-foreground-tertiary">
                  You'll receive a notification once your account is approved by
                  an administrator.
                </p>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

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
      <main className="flex-1 flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-4xl space-y-8">
          {/* Title */}
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-semibold tracking-tight text-foreground">
              Create Your Account
            </h1>
            <p className="text-lg text-foreground-secondary">
              {step === "role" && "Select your role to get started"}
              {step === "classCode" && "Enter your class code to continue"}
              {step === "register" && "Complete your registration"}
            </p>
          </div>

          {/* Role Selection */}
          {step === "role" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {/* Student Card */}
              <div
                onClick={() => handleRoleSelect("student")}
                className="group cursor-pointer bg-card border-2 border-border hover:border-accent-orange rounded-xl p-8 transition-all hover:shadow-lg"
              >
                <div className="text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-accent-orange/10 text-accent-orange group-hover:bg-accent-orange/20 transition-colors">
                    <GraduationCap className="h-10 w-10" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-foreground">
                      Student
                    </h3>
                    <p className="text-sm text-foreground-secondary">
                      Join a class with a class code
                    </p>
                  </div>
                  <Button className="w-full" size="lg">
                    Sign Up as Student
                  </Button>
                  <p className="text-xs text-foreground-tertiary">
                    Requires class code from professor
                  </p>
                </div>
              </div>

              {/* Professor Card */}
              <div
                onClick={() => handleRoleSelect("professor")}
                className="group cursor-pointer bg-card border-2 border-border hover:border-accent-purple rounded-xl p-8 transition-all hover:shadow-lg"
              >
                <div className="text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-accent-purple/10 text-accent-purple group-hover:bg-accent-purple/20 transition-colors">
                    <Users className="h-10 w-10" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-foreground">
                      Professor
                    </h3>
                    <p className="text-sm text-foreground-secondary">
                      Create classes and grade student work
                    </p>
                  </div>
                  <Button variant="purple" className="w-full" size="lg">
                    Sign Up as Professor
                  </Button>
                  <p className="text-xs text-foreground-tertiary">
                    Requires admin approval
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Class Code Input */}
          {step === "classCode" && (
            <div className="max-w-lg mx-auto">
              <div className="bg-card border border-border rounded-xl p-8 space-y-6">
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent-orange/10 text-accent-orange mb-2">
                    <GraduationCap className="h-8 w-8" />
                  </div>
                  <h2 className="text-2xl font-semibold text-foreground">
                    Student Sign Up
                  </h2>
                  <p className="text-foreground-secondary">
                    Enter the class code provided by your professor
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="classCode">Class Code</Label>
                    <Input
                      id="classCode"
                      type="text"
                      className="text-center text-xl font-mono tracking-wider uppercase"
                      placeholder="e.g., ALI-CS101-FA25-01"
                      value={classCode}
                      onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === "Enter" && handleClassCodeContinue()}
                    />
                  </div>

                  {error && (
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-error/10 border border-error/20 text-error">
                      <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                      <p className="text-sm">{error}</p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setStep("role");
                        setSelectedRole(null);
                        setClassCode("");
                        setError(null);
                      }}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={handleClassCodeContinue}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Validating...
                        </>
                      ) : (
                        "Continue"
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Registration Form */}
          {step === "register" && (
            <div className="max-w-lg mx-auto">
              <div className="bg-card border border-border rounded-xl p-8 space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-semibold text-foreground">
                    Complete Your Registration
                  </h2>
                  <p className="text-foreground-secondary">
                    {selectedRole === "professor"
                      ? "Create your professor account"
                      : "Create your student account"}
                  </p>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>

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

                  <div className="space-y-2">
                    <Label htmlFor="usernameSchoolId">School ID</Label>
                    <Input
                      id="usernameSchoolId"
                      type="number"
                      placeholder="Enter your school ID (0-1000000)"
                      value={usernameSchoolId}
                      onChange={(e) => setUsernameSchoolId(e.target.value)}
                      required
                      min="0"
                      max="1000000"
                      disabled={isLoading}
                    />
                    <p className="text-xs text-foreground-tertiary">
                      {selectedRole === "professor"
                        ? "Your school ID will be used in class codes"
                        : "Enter your student school ID number"}
                    </p>
                  </div>

                  {selectedRole === "student" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="Create a password (min 6 characters)"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          minLength={6}
                          disabled={isLoading}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder="Re-enter your password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          disabled={isLoading}
                        />
                      </div>
                    </>
                  )}

                  {error && (
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-error/10 border border-error/20 text-error">
                      <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                      <p className="text-sm">{error}</p>
                    </div>
                  )}

                  {selectedRole === "professor" && (
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-info/10 border border-info/20 text-info">
                      <Info className="h-5 w-5 flex-shrink-0 mt-0.5" />
                      <p className="text-sm">
                        A unique 6-character password will be generated for you
                        upon registration.
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        if (selectedRole === "student") {
                          setStep("classCode");
                        } else {
                          setStep("role");
                          setSelectedRole(null);
                        }
                        setError(null);
                      }}
                      disabled={isLoading}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create Account"
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Sign In Link */}
          <div className="text-center">
            <p className="text-foreground-secondary">
              Already have an account?{" "}
              <Link
                href="/sign-in"
                className="text-accent-orange hover:text-accent-orange-hover font-medium transition-colors"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
