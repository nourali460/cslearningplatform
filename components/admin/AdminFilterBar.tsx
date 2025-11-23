'use client'

import { useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X, Check, ChevronsUpDown } from 'lucide-react'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

type FilterOption = {
  terms: string[]
  years: number[]
  professors: { id: string; name: string }[]
  courses: { id: string; code: string; title: string }[]
  classes: { id: string; code: string; title: string }[]
  students: { id: string; name: string }[]
  assessments: { id: string; title: string; courseCode: string }[]
}

export function AdminFilterBar({ options }: { options?: FilterOption }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [openStudent, setOpenStudent] = useState(false)
  const [openProfessor, setOpenProfessor] = useState(false)
  const [openAssessment, setOpenAssessment] = useState(false)

  const currentTerm = searchParams.get('term') || ''
  const currentYear = searchParams.get('year') || ''
  const currentProfessor = searchParams.get('professorId') || ''
  const currentCourse = searchParams.get('courseId') || ''
  const currentClass = searchParams.get('classId') || ''
  const currentStudent = searchParams.get('studentId') || ''
  const currentAssessment = searchParams.get('assessmentId') || ''

  // Provide defaults if options is undefined
  const terms = options?.terms || []
  const years = options?.years || []
  const professors = options?.professors || []
  const courses = options?.courses || []
  const classes = options?.classes || []
  const students = options?.students || []
  const assessments = options?.assessments || []

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())

    if (value && value !== 'all') {
      params.set(key, value)
    } else {
      params.delete(key)
    }

    router.push(`${pathname}?${params.toString()}`)
  }

  const clearAllFilters = () => {
    router.push(pathname)
  }

  const hasActiveFilters =
    currentTerm || currentYear || currentProfessor || currentCourse || currentClass || currentStudent || currentAssessment

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-background p-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Filter by:</span>
      </div>

      {/* Student Filter (Searchable) */}
      <Popover open={openStudent} onOpenChange={setOpenStudent}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={openStudent}
            className="w-[200px] justify-between"
          >
            {currentStudent
              ? students.find((student) => student.id === currentStudent)?.name
              : 'All Students'}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandInput placeholder="Search students..." />
            <CommandList>
              <CommandEmpty>No student found.</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    updateFilter('studentId', '')
                    setOpenStudent(false)
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      !currentStudent ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  All Students
                </CommandItem>
                {students.map((student) => (
                  <CommandItem
                    key={student.id}
                    value={student.name}
                    onSelect={() => {
                      updateFilter('studentId', student.id)
                      setOpenStudent(false)
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        currentStudent === student.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {student.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Term Filter */}
      <Select value={currentTerm || 'all'} onValueChange={(value) => updateFilter('term', value)}>
        <SelectTrigger className="w-[140px]">
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

      {/* Year Filter */}
      <Select
        value={currentYear || 'all'}
        onValueChange={(value) => updateFilter('year', value)}
      >
        <SelectTrigger className="w-[130px]">
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

      {/* Professor Filter (Searchable) */}
      <Popover open={openProfessor} onOpenChange={setOpenProfessor}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={openProfessor}
            className="w-[200px] justify-between"
          >
            {currentProfessor
              ? professors.find((prof) => prof.id === currentProfessor)?.name
              : 'All Professors'}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandInput placeholder="Search professors..." />
            <CommandList>
              <CommandEmpty>No professor found.</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    updateFilter('professorId', '')
                    setOpenProfessor(false)
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      !currentProfessor ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  All Professors
                </CommandItem>
                {professors.map((prof) => (
                  <CommandItem
                    key={prof.id}
                    value={prof.name}
                    onSelect={() => {
                      updateFilter('professorId', prof.id)
                      setOpenProfessor(false)
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        currentProfessor === prof.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {prof.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Course Filter */}
      <Select
        value={currentCourse || 'all'}
        onValueChange={(value) => updateFilter('courseId', value)}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="All Courses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Courses</SelectItem>
          <SelectItem value="no-course">No Course</SelectItem>
          {courses.map((course) => (
            <SelectItem key={course.id} value={course.id}>
              {course.code} - {course.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Class Filter */}
      <Select
        value={currentClass || 'all'}
        onValueChange={(value) => updateFilter('classId', value)}
      >
        <SelectTrigger className="w-[220px]">
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

      {/* Assessment Filter (Searchable) */}
      <Popover open={openAssessment} onOpenChange={setOpenAssessment}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={openAssessment}
            className="w-[240px] justify-between"
          >
            {currentAssessment
              ? (() => {
                  const assessment = assessments.find((a) => a.id === currentAssessment)
                  return assessment
                    ? `${assessment.courseCode}: ${assessment.title}`
                    : 'All Assessments'
                })()
              : 'All Assessments'}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[240px] p-0">
          <Command>
            <CommandInput placeholder="Search assessments..." />
            <CommandList>
              <CommandEmpty>No assessment found.</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    updateFilter('assessmentId', '')
                    setOpenAssessment(false)
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      !currentAssessment ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  All Assessments
                </CommandItem>
                {assessments.map((assessment) => (
                  <CommandItem
                    key={assessment.id}
                    value={`${assessment.courseCode} ${assessment.title}`}
                    onSelect={() => {
                      updateFilter('assessmentId', assessment.id)
                      setOpenAssessment(false)
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        currentAssessment === assessment.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div>
                      <div className="font-medium">{assessment.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {assessment.courseCode}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAllFilters}
          className="ml-auto"
        >
          <X className="mr-1 h-4 w-4" />
          Clear filters
        </Button>
      )}
    </div>
  )
}
