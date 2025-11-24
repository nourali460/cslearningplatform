import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST() {
  const prisma = db

  try {
    console.log('🌱 Starting database seeding...')

    // Primary admin user configuration
    const PRIMARY_ADMIN = {
      clerkId: 'user_35rVge67RtsAqrA0Vl4JC6F9dOW',
      email: 'subscriptionnova@gmail.com',
      fullName: 'Nour Ali',
      role: 'admin',
    }

    // Step 1: Ensure primary admin exists
    const existingAdmin = await prisma.user.findUnique({
      where: { clerkId: PRIMARY_ADMIN.clerkId },
    })

    if (!existingAdmin) {
      await prisma.user.create({ data: PRIMARY_ADMIN })
      console.log('✅ Created primary admin')
    } else {
      console.log('✅ Primary admin exists')
    }

    // Step 2: Clean test data (preserve primary admin)
    await prisma.assessmentSubmission.deleteMany()
    await prisma.assessment.deleteMany()
    await prisma.enrollment.deleteMany()
    await prisma.class.deleteMany()
    await prisma.course.deleteMany()
    await prisma.user.deleteMany({
      where: { clerkId: { not: PRIMARY_ADMIN.clerkId } },
    })
    console.log('✅ Cleaned test data')

    // Step 3: Create test users
    // Create professors (including primary admin as professor for testing)
    const professorAdmin = await prisma.user.findUnique({
      where: { clerkId: PRIMARY_ADMIN.clerkId },
    })

    const professors = [
      professorAdmin!, // Use admin user as professor for testing
      await prisma.user.create({
        data: {
          clerkId: 'clerk_prof1_placeholder',
          email: 'prof.smith@cslearning.edu',
          fullName: 'Dr. Sarah Smith',
          role: 'professor',
        },
      }),
    ]
    console.log(`✅ Created ${professors.length - 1} test professors`)

    const students = [
      professorAdmin!, // Use admin user as student for testing
      await prisma.user.create({
        data: {
          clerkId: 'clerk_student1_placeholder',
          email: 'alice.wonder@student.cslearning.edu',
          fullName: 'Alice Wonderland',
          role: 'student',
        },
      }),
      await prisma.user.create({
        data: {
          clerkId: 'clerk_student2_placeholder',
          email: 'bob.builder@student.cslearning.edu',
          fullName: 'Bob Builder',
          role: 'student',
        },
      }),
    ]
    console.log(`✅ Created ${students.length - 1} test students`)

    // Step 4: Create courses
    const courses = await Promise.all([
      prisma.course.create({
        data: {
          code: 'CS101',
          title: 'Introduction to Java Programming',
          description: 'Learn the fundamentals of Java programming.',
          subject: 'Computer Science',
          level: 'Beginner',
        },
      }),
      prisma.course.create({
        data: {
          code: 'CS102',
          title: 'Web Development Fundamentals',
          description: 'Learn HTML, CSS, JavaScript.',
          subject: 'Computer Science',
          level: 'Beginner',
        },
      }),
    ])
    console.log(`✅ Created ${courses.length} courses`)

    // Step 5: Create classes
    const classes = await Promise.all([
      prisma.class.create({
        data: {
          courseId: courses[0].id,
          professorId: professors[0].id,
          title: 'CS101 Section 01 - Fall 2025',
          term: 'Fall',
          year: 2025,
          section: '01',
          classCode: 'CSLEARN-CS101-FA25-01',
        },
      }),
      prisma.class.create({
        data: {
          courseId: courses[1].id,
          professorId: professors[1].id,
          title: 'CS102 Section 01 - Fall 2025',
          term: 'Fall',
          year: 2025,
          section: '01',
          classCode: 'CSLEARN-CS102-FA25-01',
        },
      }),
    ])
    console.log(`✅ Created ${classes.length} classes`)

    // Step 6: Create enrollments
    const enrollments = await Promise.all([
      ...students.map((student) =>
        prisma.enrollment.create({
          data: {
            classId: classes[0].id,
            studentId: student.id,
            status: 'active',
          },
        })
      ),
    ])
    console.log(`✅ Created ${enrollments.length} enrollments`)

    // Step 7: Create assessments
    const assessments = await Promise.all([
      prisma.assessment.create({
        data: {
          classId: classes[0].id,
          title: 'Lab 1: Hello World',
          slug: 'lab-1-hello-world',
          description: 'Write your first Java program.',
          dueAt: new Date('2025-09-15T23:59:59Z'),
          maxPoints: 10,
          orderIndex: 1,
        },
      }),
      prisma.assessment.create({
        data: {
          classId: classes[0].id,
          title: 'Lab 2: Variables and Data Types',
          slug: 'lab-2-variables',
          description: 'Practice working with different data types.',
          dueAt: new Date('2025-09-22T23:59:59Z'),
          maxPoints: 15,
          orderIndex: 2,
        },
      }),
      prisma.assessment.create({
        data: {
          classId: classes[1].id,
          title: 'Project 1: Personal Portfolio Website',
          slug: 'project-1-portfolio',
          description: 'Create a personal portfolio website.',
          dueAt: new Date('2025-09-30T23:59:59Z'),
          maxPoints: 50,
          orderIndex: 1,
        },
      }),
    ])
    console.log(`✅ Created ${assessments.length} assessments`)

    // Step 8: Create submissions
    const submissions = await Promise.all([
      prisma.assessmentSubmission.create({
        data: {
          assessmentId: assessments[0].id,
          studentId: students[0].id,
          autoScore: 10,
          manualScore: 0,
          totalScore: 10,
          feedback: 'Perfect! Great job on your first Java program.',
          status: 'GRADED',
          attemptNumber: 1,
        },
      }),
      prisma.assessmentSubmission.create({
        data: {
          assessmentId: assessments[0].id,
          studentId: students[1].id,
          autoScore: 9,
          manualScore: 1,
          totalScore: 10,
          feedback: 'Excellent work! Minor formatting issue fixed.',
          status: 'GRADED',
          attemptNumber: 1,
        },
      }),
      prisma.assessmentSubmission.create({
        data: {
          assessmentId: assessments[1].id,
          studentId: students[0].id,
          autoScore: 15,
          totalScore: 15,
          feedback: 'Outstanding! Great understanding of data types.',
          status: 'GRADED',
          attemptNumber: 1,
        },
      }),
    ])
    console.log(`✅ Created ${submissions.length} submissions`)

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      summary: {
        professors: professors.length,
        students: students.length,
        courses: courses.length,
        classes: classes.length,
        enrollments: enrollments.length,
        assessments: assessments.length,
        submissions: submissions.length,
      },
    })
  } catch (error: any) {
    console.error('❌ Seeding error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
