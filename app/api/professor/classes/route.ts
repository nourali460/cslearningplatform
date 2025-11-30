import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireProfessor, handleAuthError } from '@/lib/auth'
import { generateClassCode, classCodeExists } from '@/lib/class-code-generator'
import { createAssessmentsFromTemplates } from '@/lib/assessment-templates'
import { createModulesFromTemplates } from '@/lib/module-templates'

/**
 * GET /api/professor/classes
 * Get all classes for the current professor
 */
export async function GET() {
  try {
    // Check authentication
    const professor = await requireProfessor()

    // Fetch professor's classes
    const classes = await db.class.findMany({
      where: {
        professorId: professor.id,
      },
      include: {
        course: {
          select: {
            id: true,
            code: true,
            title: true,
            description: true,
            subject: true,
            level: true,
          },
        },
        _count: {
          select: {
            enrollments: true,
            assessments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({
      classes: classes.map((cls) => ({
        id: cls.id,
        classCode: cls.classCode,
        title: cls.title,
        term: cls.term,
        year: cls.year,
        section: cls.section,
        isActive: cls.isActive,
        createdAt: cls.createdAt,
        course: cls.course,
        _count: {
          enrollments: cls._count.enrollments,
          assessments: cls._count.assessments,
        },
      })),
      total: classes.length,
    })
  } catch (error) {
    console.error('Error fetching professor classes:', error)
    return handleAuthError(error)
  }
}

/**
 * POST /api/professor/classes
 * Create a new class for a course (professor adopts a course)
 */
export async function POST(request: Request) {
  try {
    // Check authentication (includes isApproved check)
    const professor = await requireProfessor()

    if (!professor.usernameSchoolId) {
      return NextResponse.json(
        { error: 'School ID not set. Please contact administrator.' },
        { status: 400 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { courseId, term, year, section } = body

    // Validation
    if (!courseId || !term || !year || !section) {
      return NextResponse.json(
        { error: 'Missing required fields: courseId, term, year, section' },
        { status: 400 }
      )
    }

    // Validate term
    const validTerms = ['Fall', 'Spring', 'Summer', 'Winter']
    if (!validTerms.includes(term)) {
      return NextResponse.json(
        { error: `Invalid term. Must be one of: ${validTerms.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate year
    const yearNum = parseInt(year, 10)
    if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
      return NextResponse.json(
        { error: 'Invalid year. Must be between 2000 and 2100' },
        { status: 400 }
      )
    }

    // Validate section format
    if (!/^\d{1,2}$/.test(section)) {
      return NextResponse.json(
        { error: 'Invalid section. Must be a 1-2 digit number' },
        { status: 400 }
      )
    }

    // Get course details
    const course = await db.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        code: true,
        title: true,
        isActive: true,
      },
    })

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    if (!course.isActive) {
      return NextResponse.json(
        { error: 'This course is no longer available' },
        { status: 400 }
      )
    }

    // Generate class code
    const classCode = generateClassCode(
      professor.usernameSchoolId,
      course.code,
      term,
      yearNum,
      section
    )

    // Check if class code already exists
    const exists = await classCodeExists(classCode)
    if (exists) {
      return NextResponse.json(
        {
          error: `Class code ${classCode} already exists. This course/term/year/section combination is already taken. Try a different section number.`,
          classCode,
        },
        { status: 409 }
      )
    }

    // Generate class title
    const classTitle = `${course.title} - ${term} ${yearNum} Section ${section.padStart(2, '0')}`

    // Create the class
    const newClass = await db.class.create({
      data: {
        courseId: course.id,
        professorId: professor.id,
        title: classTitle,
        term,
        year: yearNum,
        section: section.padStart(2, '0'),
        classCode,
        isActive: true,
      },
      include: {
        course: {
          select: {
            code: true,
            title: true,
          },
        },
        professor: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
    })

    // Auto-generate assessments from course templates
    try {
      const assessmentCount = await createAssessmentsFromTemplates(newClass.id, course.id)
      console.log(`[Class Creation] Created ${assessmentCount} assessments from templates`)
    } catch (error) {
      console.error('[Class Creation] Failed to create assessments from templates:', error)
      // Don't fail class creation if assessment generation fails
      // Professors can manually add assessments later
    }

    // Auto-generate modules from course templates
    try {
      const moduleCount = await createModulesFromTemplates(newClass.id, course.id)
      console.log(`[Class Creation] Created ${moduleCount} modules from templates`)
    } catch (error) {
      console.error('[Class Creation] Failed to create modules from templates:', error)
      // Don't fail class creation if module generation fails
      // Professors can manually add modules later
    }

    return NextResponse.json({
      success: true,
      message: 'Class created successfully',
      class: {
        id: newClass.id,
        title: newClass.title,
        classCode: newClass.classCode,
        term: newClass.term,
        year: newClass.year,
        section: newClass.section,
        course: {
          code: newClass.course.code,
          title: newClass.course.title,
        },
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating class:', error)
    return handleAuthError(error)
  }
}
