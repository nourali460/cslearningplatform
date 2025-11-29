"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  BarChart3,
  Users,
  Settings,
  ChevronLeft,
  LogOut,
  GraduationCap
} from "lucide-react";
import { useState } from "react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface SidebarProps {
  navItems: NavItem[];
  user: {
    fullName?: string;
    email: string;
    role?: string;
  };
  onLogout: () => void;
  title: string;
  subtitle?: string;
}

export function Sidebar({ navItems, user, onLogout, title, subtitle }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-card border-r border-border transition-all duration-300 overflow-hidden",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Header */}
      <div className="p-6 border-b border-border flex-shrink-0">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-accent-orange" />
              <div>
                <h2 className="text-lg font-semibold text-foreground">{title}</h2>
                {subtitle && (
                  <p className="text-xs text-foreground-secondary">{subtitle}</p>
                )}
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="ml-auto"
          >
            <ChevronLeft
              className={cn(
                "h-4 w-4 transition-transform",
                isCollapsed && "rotate-180"
              )}
            />
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                  isActive
                    ? "bg-accent-orange/10 text-accent-orange font-medium"
                    : "text-foreground-secondary hover:bg-background-secondary hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && <span className="text-sm">{item.label}</span>}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-border flex-shrink-0">
        {!isCollapsed ? (
          <div className="space-y-3">
            <div className="px-3">
              <p className="text-xs text-foreground-tertiary mb-1">Signed in as</p>
              <p className="text-sm font-medium text-foreground truncate">
                {user.fullName || user.email}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onLogout}
              className="w-full justify-start"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={onLogout}
            title="Sign Out"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        )}
      </div>
    </aside>
  );
}

// Export common icon sets for different roles
export const icons = {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  BarChart3,
  Users,
  Settings,
};
