"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

interface TopNavProps {
  className?: string;
}

export function TopNav({ className }: TopNavProps) {
  return (
    <nav className={cn("border-b border-border bg-card", className)}>
      <div className="container-claude">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <GraduationCap className="h-6 w-6 text-accent-orange" />
            <span className="font-semibold text-lg text-foreground">CS Learning Platform</span>
          </Link>

          {/* Navigation Links & Auth Buttons */}
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="text-sm font-medium text-foreground-secondary hover:text-foreground transition-colors"
            >
              Home
            </Link>
            <Link
              href="/about"
              className="text-sm font-medium text-foreground-secondary hover:text-foreground transition-colors hidden sm:block"
            >
              About
            </Link>
            <div className="flex items-center gap-3 ml-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/sign-in">Sign In</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/sign-up">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
