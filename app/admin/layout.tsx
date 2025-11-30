"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/navigation/Sidebar";
import { professorNavItems } from "@/lib/navigation";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  MessageSquare,
  FlaskConical,
  HelpCircle,
  FileText,
  BookOpenCheck,
} from "lucide-react";

const adminNavItems = [
  { href: "/admin/overview", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/people", label: "People", icon: Users },
  { href: "/admin/courses", label: "Courses & Classes", icon: BookOpen },
  { href: "/admin/templates/discussion", label: "💬 Discussion Templates", icon: MessageSquare },
  { href: "/admin/templates/lab", label: "🧪 Lab Templates", icon: FlaskConical },
  { href: "/admin/templates/quiz", label: "❓ Quiz Templates", icon: HelpCircle },
  { href: "/admin/templates/exam", label: "📝 Exam Templates", icon: FileText },
  { href: "/admin/templates/lesson", label: "📖 Lesson Templates", icon: BookOpenCheck },
  { href: "/admin/templates/page", label: "📄 Page Templates", icon: FileText },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const isTemplateRoute = pathname?.startsWith('/admin/templates');

    if (isTemplateRoute) {
      // For template routes, allow both admin and professor
      checkDualRole();
    } else {
      // For other admin routes, enforce admin-only
      checkAdminOnly();
    }
  }, [router, pathname]);

  const checkAdminOnly = () => {
    fetch("/api/admin/whoami")
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
  };

  const checkDualRole = async () => {
    let adminStatus = 0;
    let profStatus = 0;

    try {
      const adminRes = await fetch('/api/admin/whoami');
      adminStatus = adminRes.status;
      if (adminRes.ok) {
        const data = await adminRes.json();
        setUser({
          fullName: data.user.fullName,
          email: data.user.email,
          role: data.user.role,
        });
        setIsLoading(false);
        return;
      }
    } catch (error) {
      console.error('Error checking admin role:', error);
    }

    try {
      const profRes = await fetch('/api/professor/profile');
      profStatus = profRes.status;
      if (profRes.ok) {
        const data = await profRes.json();
        setUser({
          fullName: data.professor.fullName,
          email: data.professor.email,
          role: 'professor',
        });
        setIsLoading(false);
        return;
      }
    } catch (error) {
      console.error('Error checking professor role:', error);
    }

    const isNotAdmin = adminStatus === 401 || adminStatus === 403;
    const isNotProfessor = profStatus === 401 || profStatus === 403;

    if (isNotAdmin && isNotProfessor) {
      console.log('Not authenticated - redirecting to sign-in');
      router.push('/sign-in');
    } else {
      console.error('Unable to detect role');
      setIsLoading(false);
    }
  };

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

  // Determine which sidebar to show based on user role
  const isProfessor = user.role === 'professor';
  const sidebarNavItems = isProfessor ? professorNavItems : adminNavItems;
  const sidebarTitle = isProfessor ? 'Professor Portal' : 'Admin Panel';

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        navItems={sidebarNavItems}
        user={user}
        onLogout={handleLogout}
        title={sidebarTitle}
        subtitle="CS Learning Platform"
      />
      <main className="flex-1 overflow-y-auto">
        <div className="container-claude py-8">{children}</div>
      </main>
    </div>
  );
}
