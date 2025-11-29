"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar, icons } from "@/components/navigation/Sidebar";
import { LayoutDashboard, BookOpen, ClipboardList, BarChart3 } from "lucide-react";

const navItems = [
  { href: "/student", label: "Dashboard", icon: LayoutDashboard },
  { href: "/student/classes", label: "My Classes", icon: BookOpen },
  { href: "/student/assignments", label: "Assignments", icon: ClipboardList },
  { href: "/student/grades", label: "Grades", icon: BarChart3 },
];

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/student/whoami")
      .then((res) => res.json())
      .then((data) => {
        setUser({
          fullName: data.user.fullName,
          email: data.user.email,
          role: data.user.role,
        });
        setIsLoading(false);
      })
      .catch(() => {
        router.push("/sign-in");
      });
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/sign-in");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-accent-orange" />
          <p className="text-sm text-foreground-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        navItems={navItems}
        user={user}
        onLogout={handleLogout}
        title="Student Portal"
        subtitle="CS Learning Platform"
      />
      <main className="flex-1 overflow-y-auto">
        <div className="container-claude py-8">{children}</div>
      </main>
    </div>
  );
}
