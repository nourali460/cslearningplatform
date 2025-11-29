"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { X, Filter, Check, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type FilterOption = {
  terms: string[];
  years: number[];
  professors: { id: string; name: string }[];
  courses: { id: string; code: string; title: string }[];
  classes: { id: string; code: string; title: string }[];
  students: { id: string; name: string }[];
  assessments: { id: string; title: string; courseCode: string }[];
};

type AvailableFilters = {
  showStudent?: boolean;
  showTerm?: boolean;
  showYear?: boolean;
  showProfessor?: boolean;
  showCourse?: boolean;
  showClass?: boolean;
  showAssessment?: boolean;
};

export function AdminFilterBar({
  options,
  availableFilters = {
    showStudent: true,
    showTerm: true,
    showYear: true,
    showProfessor: true,
    showCourse: true,
    showClass: true,
    showAssessment: true,
  },
}: {
  options?: FilterOption;
  availableFilters?: AvailableFilters;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isExpanded, setIsExpanded] = useState(false);

  const currentTerm = searchParams.get("term") || "";
  const currentYear = searchParams.get("year") || "";
  const currentProfessor = searchParams.get("professorId") || "";
  const currentCourse = searchParams.get("courseId") || "";
  const currentClass = searchParams.get("classId") || "";
  const currentStudent = searchParams.get("studentId") || "";
  const currentAssessment = searchParams.get("assessmentId") || "";

  // Provide defaults if options is undefined
  const terms = options?.terms || [];
  const years = options?.years || [];
  const professors = options?.professors || [];
  const courses = options?.courses || [];
  const classes = options?.classes || [];
  const students = options?.students || [];
  const assessments = options?.assessments || [];

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    router.push(`${pathname}?${params.toString()}`);
  };

  const clearAllFilters = () => {
    router.push(pathname);
  };

  const hasActiveFilters =
    currentTerm ||
    currentYear ||
    currentProfessor ||
    currentCourse ||
    currentClass ||
    currentStudent ||
    currentAssessment;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between py-2 px-4 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <CardTitle className="flex items-center gap-2 text-base">
          <Filter className="h-4 w-4 text-accent-orange" />
          Filters
          {hasActiveFilters && (
            <span className="ml-2 text-xs font-normal text-foreground-tertiary">
              ({Object.values({ currentTerm, currentYear, currentProfessor, currentCourse, currentClass, currentStudent, currentAssessment }).filter(Boolean).length} active)
            </span>
          )}
        </CardTitle>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                clearAllFilters();
              }}
              className="h-7 text-xs"
            >
              <X className="mr-1 h-3 w-3" />
              Clear
            </Button>
          )}
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="px-4 pb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Student Filter */}
          {availableFilters.showStudent && (
            <div className="space-y-1.5">
              <Label htmlFor="student-filter" className="text-[10px] text-foreground-tertiary uppercase tracking-wide font-medium">
                Student
              </Label>
              <Select
                value={currentStudent || "all"}
                onValueChange={(value) => updateFilter("studentId", value)}
              >
                <SelectTrigger id="student-filter">
                  <SelectValue placeholder="All Students" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Students</SelectItem>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Term Filter */}
          {availableFilters.showTerm && (
            <div className="space-y-1.5">
              <Label htmlFor="term-filter" className="text-[10px] text-foreground-tertiary uppercase tracking-wide font-medium">
                Term
              </Label>
              <Select
                value={currentTerm || "all"}
                onValueChange={(value) => updateFilter("term", value)}
              >
                <SelectTrigger id="term-filter">
                  <SelectValue placeholder="All Terms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Terms</SelectItem>
                  {terms.map((term) => (
                    <SelectItem key={term} value={term}>
                      {term}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Year Filter */}
          {availableFilters.showYear && (
            <div className="space-y-1.5">
              <Label htmlFor="year-filter" className="text-[10px] text-foreground-tertiary uppercase tracking-wide font-medium">
                Year
              </Label>
              <Select
                value={currentYear || "all"}
                onValueChange={(value) => updateFilter("year", value)}
              >
                <SelectTrigger id="year-filter">
                  <SelectValue placeholder="All Years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Professor Filter */}
          {availableFilters.showProfessor && (
            <div className="space-y-1.5">
              <Label htmlFor="professor-filter" className="text-[10px] text-foreground-tertiary uppercase tracking-wide font-medium">
                Professor
              </Label>
              <Select
                value={currentProfessor || "all"}
                onValueChange={(value) => updateFilter("professorId", value)}
              >
                <SelectTrigger id="professor-filter">
                  <SelectValue placeholder="All Professors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Professors</SelectItem>
                  {professors.map((prof) => (
                    <SelectItem key={prof.id} value={prof.id}>
                      {prof.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Course Filter */}
          {availableFilters.showCourse && (
            <div className="space-y-1.5">
              <Label htmlFor="course-filter" className="text-[10px] text-foreground-tertiary uppercase tracking-wide font-medium">
                Course
              </Label>
              <Select
                value={currentCourse || "all"}
                onValueChange={(value) => updateFilter("courseId", value)}
              >
                <SelectTrigger id="course-filter">
                  <SelectValue placeholder="All Courses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.code} - {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Class Filter */}
          {availableFilters.showClass && (
            <div className="space-y-1.5">
              <Label htmlFor="class-filter" className="text-[10px] text-foreground-tertiary uppercase tracking-wide font-medium">
                Class
              </Label>
              <Select
                value={currentClass || "all"}
                onValueChange={(value) => updateFilter("classId", value)}
              >
                <SelectTrigger id="class-filter">
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Assessment Filter */}
          {availableFilters.showAssessment && (
            <div className="space-y-1.5">
              <Label htmlFor="assessment-filter" className="text-[10px] text-foreground-tertiary uppercase tracking-wide font-medium">
                Assessment
              </Label>
              <Select
                value={currentAssessment || "all"}
                onValueChange={(value) => updateFilter("assessmentId", value)}
              >
                <SelectTrigger id="assessment-filter">
                  <SelectValue placeholder="All Assessments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assessments</SelectItem>
                  {assessments.map((assessment) => (
                    <SelectItem key={assessment.id} value={assessment.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{assessment.title}</span>
                        <span className="text-xs text-foreground-tertiary">
                          {assessment.courseCode}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </CardContent>
      )}
    </Card>
  );
}
