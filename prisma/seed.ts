// Seed script for database initialization
import { PrismaClient } from '@prisma/client'

// Create Prisma client
const prisma = new PrismaClient()

// Primary admin user configuration
const PRIMARY_ADMIN = {
  clerkId: 'user_35rVge67RtsAqrA0Vl4JC6F9dOW',
  email: 'subscriptionnova@gmail.com',
  fullName: 'Nour Ali',
  role: 'admin',
}

async function ensurePrimaryAdmin() {
  // Check if primary admin exists
  const existingAdmin = await prisma.user.findUnique({
    where: { clerkId: PRIMARY_ADMIN.clerkId },
  })

  if (existingAdmin) {
    console.log('✅ Primary admin user already exists:', existingAdmin.email)
    return existingAdmin
  }

  // Create primary admin if doesn't exist
  const admin = await prisma.user.create({
    data: PRIMARY_ADMIN,
  })
  console.log('✅ Created primary admin user:', admin.email)
  return admin
}

async function main() {
  console.log('🌱 Starting database initialization...')

  try {
    // Step 1: Ensure primary admin always exists
    console.log('\n📋 Checking primary admin user...')
    await ensurePrimaryAdmin()

    // Step 2: Clean and seed test data (optional)
    console.log('\n🧹 Cleaning test data...')

    // Delete test data but preserve the primary admin
    await prisma.assessmentSubmission.deleteMany()
    await prisma.assessment.deleteMany()
    await prisma.enrollment.deleteMany()
    await prisma.class.deleteMany()
    await prisma.course.deleteMany()

    // Delete only non-primary admin users
    await prisma.user.deleteMany({
      where: {
        clerkId: {
          not: PRIMARY_ADMIN.clerkId,
        },
      },
    })

    console.log('✅ Cleaned test data (preserved primary admin)')

    // Step 3: Create test users
    console.log('\n👥 Creating test users...')

    const professors = await Promise.all([
      prisma.user.create({
        data: {
          clerkId: 'clerk_prof1_placeholder',
          email: 'prof.smith@cslearning.edu',
          fullName: 'Dr. Sarah Smith',
          username: 'SMITH',
          role: 'professor',
          isApproved: true,
        },
      }),
      prisma.user.create({
        data: {
          clerkId: 'clerk_prof2_placeholder',
          email: 'prof.johnson@cslearning.edu',
          fullName: 'Dr. Michael Johnson',
          username: 'JOHNSON',
          role: 'professor',
          isApproved: true,
        },
      }),
    ])
    console.log(`✅ Created ${professors.length} test professors`)

    const students = await Promise.all([
      prisma.user.create({
        data: {
          clerkId: 'clerk_student1_placeholder',
          email: 'alice.wonder@student.cslearning.edu',
          fullName: 'Alice Wonderland',
          role: 'student',
        },
      }),
      prisma.user.create({
        data: {
          clerkId: 'clerk_student2_placeholder',
          email: 'bob.builder@student.cslearning.edu',
          fullName: 'Bob Builder',
          role: 'student',
        },
      }),
      prisma.user.create({
        data: {
          clerkId: 'clerk_student3_placeholder',
          email: 'charlie.brown@student.cslearning.edu',
          fullName: 'Charlie Brown',
          role: 'student',
        },
      }),
      prisma.user.create({
        data: {
          clerkId: 'clerk_student4_placeholder',
          email: 'diana.prince@student.cslearning.edu',
          fullName: 'Diana Prince',
          role: 'student',
        },
      }),
      prisma.user.create({
        data: {
          clerkId: 'clerk_student5_placeholder',
          email: 'ethan.hunt@student.cslearning.edu',
          fullName: 'Ethan Hunt',
          role: 'student',
        },
      }),
    ])
    console.log(`✅ Created ${students.length} test students`)

    // Step 4: Create courses
    console.log('\n📚 Creating courses...')
    const courses = await Promise.all([
      prisma.course.create({
        data: {
          code: 'CS101',
          title: 'Introduction to Java Programming',
          description: 'Learn the fundamentals of Java programming including OOP concepts, data structures, and algorithms.',
          subject: 'Computer Science',
          level: 'Beginner',
          isActive: true,
        },
      }),
      prisma.course.create({
        data: {
          code: 'CS102',
          title: 'Web Development Fundamentals',
          description: 'Learn HTML, CSS, JavaScript, and modern web development frameworks.',
          subject: 'Computer Science',
          level: 'Beginner',
          isActive: true,
        },
      }),
      prisma.course.create({
        data: {
          code: 'CS201',
          title: 'Data Structures and Algorithms',
          description: 'Advanced study of data structures, algorithms, and their applications.',
          subject: 'Computer Science',
          level: 'Intermediate',
          isActive: true,
        },
      }),
    ])
    console.log(`✅ Created ${courses.length} courses`)

    // Step 5: Create classes
    console.log('\n🏫 Creating classes...')
    const classes = await Promise.all([
      prisma.class.create({
        data: {
          courseId: courses[0].id,
          professorId: professors[0].id,
          title: 'CS101 Section 01 - Fall 2025',
          term: 'Fall',
          year: 2025,
          section: '01',
          classCode: 'SMITH-CS101-FA25-01',
          isActive: true,
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
          classCode: 'JOHNSON-CS102-FA25-01',
          isActive: true,
        },
      }),
      prisma.class.create({
        data: {
          courseId: courses[2].id,
          professorId: professors[0].id,
          title: 'CS201 Section 01 - Fall 2025',
          term: 'Fall',
          year: 2025,
          section: '01',
          classCode: 'SMITH-CS201-FA25-01',
          isActive: true,
        },
      }),
    ])
    console.log(`✅ Created ${classes.length} classes`)

    // Step 6: Create enrollments
    console.log('\n📝 Creating enrollments...')
    const enrollments = await Promise.all([
      // CS101 - All students
      ...students.map((student) =>
        prisma.enrollment.create({
          data: {
            classId: classes[0].id,
            studentId: student.id,
            status: 'active',
          },
        })
      ),
      // CS102 - First 3 students
      ...students.slice(0, 3).map((student) =>
        prisma.enrollment.create({
          data: {
            classId: classes[1].id,
            studentId: student.id,
            status: 'active',
          },
        })
      ),
      // CS201 - Last 2 students
      ...students.slice(3, 5).map((student) =>
        prisma.enrollment.create({
          data: {
            classId: classes[2].id,
            studentId: student.id,
            status: 'active',
          },
        })
      ),
    ])
    console.log(`✅ Created ${enrollments.length} enrollments`)

    // Step 7: Create assessments
    console.log('\n📋 Creating assessments...')
    const assessments = await Promise.all([
      // CS101 Assessments
      prisma.assessment.create({
        data: {
          classId: classes[0].id,
          title: 'Lab 1: Hello World',
          slug: 'lab-1-hello-world',
          description: 'Write your first Java program that prints "Hello, World!" to the console.',
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
          description: 'Practice working with different data types and variables in Java.',
          dueAt: new Date('2025-09-22T23:59:59Z'),
          maxPoints: 15,
          orderIndex: 2,
        },
      }),
      prisma.assessment.create({
        data: {
          classId: classes[0].id,
          title: 'Midterm Exam',
          slug: 'midterm-exam',
          description: 'Comprehensive exam covering topics from weeks 1-7.',
          dueAt: new Date('2025-10-20T23:59:59Z'),
          maxPoints: 100,
          orderIndex: 3,
        },
      }),
      // CS102 Assessments
      prisma.assessment.create({
        data: {
          classId: classes[1].id,
          title: 'Project 1: Personal Portfolio Website',
          slug: 'project-1-portfolio',
          description: 'Create a personal portfolio website using HTML and CSS.',
          dueAt: new Date('2025-09-30T23:59:59Z'),
          maxPoints: 50,
          orderIndex: 1,
        },
      }),
      prisma.assessment.create({
        data: {
          classId: classes[1].id,
          title: 'Lab 3: JavaScript Basics',
          slug: 'lab-3-javascript',
          description: 'Learn JavaScript fundamentals including variables, functions, and DOM manipulation.',
          dueAt: new Date('2025-10-10T23:59:59Z'),
          maxPoints: 20,
          orderIndex: 2,
        },
      }),
      // CS201 Assessments
      prisma.assessment.create({
        data: {
          classId: classes[2].id,
          title: 'Assignment 1: Implementing a Stack',
          slug: 'assignment-1-stack',
          description: 'Implement a stack data structure with push, pop, and peek operations.',
          dueAt: new Date('2025-09-18T23:59:59Z'),
          maxPoints: 25,
          orderIndex: 1,
        },
      }),
    ])
    console.log(`✅ Created ${assessments.length} assessments`)

    // Step 8: Create sample submissions
    console.log('\n📄 Creating sample submissions...')
    const submissions = await Promise.all([
      // CS101 Lab 1 - All 5 students enrolled
      prisma.assessmentSubmission.create({
        data: {
          assessmentId: assessments[0].id,
          studentId: students[0].id, // Alice
          autoScore: 10,
          manualScore: 0,
          totalScore: 10,
          feedback: 'Perfect! Great job on your first Java program.',
          status: 'graded',
          attemptNumber: 1,
          submittedAt: new Date('2025-09-14T15:30:00Z'),
        },
      }),
      prisma.assessmentSubmission.create({
        data: {
          assessmentId: assessments[0].id,
          studentId: students[1].id, // Bob
          autoScore: 9,
          manualScore: 1,
          totalScore: 10,
          feedback: 'Excellent work! Minor formatting issue fixed.',
          status: 'graded',
          attemptNumber: 1,
          submittedAt: new Date('2025-09-14T18:45:00Z'),
        },
      }),
      prisma.assessmentSubmission.create({
        data: {
          assessmentId: assessments[0].id,
          studentId: students[2].id, // Charlie
          autoScore: 8,
          manualScore: 0,
          totalScore: 8,
          feedback: 'Good work! Watch out for syntax errors.',
          status: 'graded',
          attemptNumber: 1,
          submittedAt: new Date('2025-09-15T10:20:00Z'),
        },
      }),
      prisma.assessmentSubmission.create({
        data: {
          assessmentId: assessments[0].id,
          studentId: students[3].id, // Diana
          autoScore: 9,
          manualScore: 0,
          totalScore: 9,
          feedback: 'Very good! Clean code structure.',
          status: 'graded',
          attemptNumber: 1,
          submittedAt: new Date('2025-09-15T14:00:00Z'),
        },
      }),
      prisma.assessmentSubmission.create({
        data: {
          assessmentId: assessments[0].id,
          studentId: students[4].id, // Ethan
          autoScore: 10,
          manualScore: 0,
          totalScore: 10,
          feedback: 'Perfect submission! Well done.',
          status: 'graded',
          attemptNumber: 1,
          submittedAt: new Date('2025-09-15T20:30:00Z'),
        },
      }),

      // CS101 Lab 2 - All 5 students
      prisma.assessmentSubmission.create({
        data: {
          assessmentId: assessments[1].id,
          studentId: students[0].id, // Alice
          autoScore: 15,
          totalScore: 15,
          feedback: 'Outstanding! You have a great understanding of data types.',
          status: 'graded',
          attemptNumber: 1,
          submittedAt: new Date('2025-09-21T16:00:00Z'),
        },
      }),
      prisma.assessmentSubmission.create({
        data: {
          assessmentId: assessments[1].id,
          studentId: students[1].id, // Bob
          autoScore: 13,
          manualScore: 1,
          totalScore: 14,
          feedback: 'Great work! One minor logical error in type conversion.',
          status: 'graded',
          attemptNumber: 1,
          submittedAt: new Date('2025-09-21T19:30:00Z'),
        },
      }),
      prisma.assessmentSubmission.create({
        data: {
          assessmentId: assessments[1].id,
          studentId: students[2].id, // Charlie
          autoScore: 12,
          totalScore: 12,
          feedback: 'Good job! Keep practicing variable naming conventions.',
          status: 'graded',
          attemptNumber: 1,
          submittedAt: new Date('2025-09-22T11:15:00Z'),
        },
      }),
      prisma.assessmentSubmission.create({
        data: {
          assessmentId: assessments[1].id,
          studentId: students[3].id, // Diana
          autoScore: 14,
          totalScore: 14,
          feedback: 'Excellent understanding of primitive and reference types!',
          status: 'graded',
          attemptNumber: 1,
          submittedAt: new Date('2025-09-22T13:45:00Z'),
        },
      }),
      prisma.assessmentSubmission.create({
        data: {
          assessmentId: assessments[1].id,
          studentId: students[4].id, // Ethan
          autoScore: 13,
          totalScore: 13,
          feedback: 'Very good! Consider adding more comments to your code.',
          status: 'graded',
          attemptNumber: 1,
          submittedAt: new Date('2025-09-22T21:00:00Z'),
        },
      }),

      // CS101 Midterm - All 5 students
      prisma.assessmentSubmission.create({
        data: {
          assessmentId: assessments[2].id,
          studentId: students[0].id, // Alice
          autoScore: 92,
          manualScore: 6,
          totalScore: 98,
          feedback: 'Exceptional performance! One of the top scores in the class.',
          status: 'graded',
          attemptNumber: 1,
          submittedAt: new Date('2025-10-20T14:30:00Z'),
        },
      }),
      prisma.assessmentSubmission.create({
        data: {
          assessmentId: assessments[2].id,
          studentId: students[1].id, // Bob
          autoScore: 78,
          manualScore: 7,
          totalScore: 85,
          feedback: 'Good work! Review recursion and inheritance concepts.',
          status: 'graded',
          attemptNumber: 1,
          submittedAt: new Date('2025-10-20T14:45:00Z'),
        },
      }),
      prisma.assessmentSubmission.create({
        data: {
          assessmentId: assessments[2].id,
          studentId: students[2].id, // Charlie
          autoScore: 70,
          manualScore: 5,
          totalScore: 75,
          feedback: 'Fair performance. Please attend office hours to review polymorphism.',
          status: 'graded',
          attemptNumber: 1,
          submittedAt: new Date('2025-10-20T15:00:00Z'),
        },
      }),
      prisma.assessmentSubmission.create({
        data: {
          assessmentId: assessments[2].id,
          studentId: students[3].id, // Diana
          autoScore: 85,
          manualScore: 8,
          totalScore: 93,
          feedback: 'Excellent exam! Strong grasp of all course concepts.',
          status: 'graded',
          attemptNumber: 1,
          submittedAt: new Date('2025-10-20T15:15:00Z'),
        },
      }),
      prisma.assessmentSubmission.create({
        data: {
          assessmentId: assessments[2].id,
          studentId: students[4].id, // Ethan
          autoScore: 82,
          manualScore: 6,
          totalScore: 88,
          feedback: 'Very good! Minor errors in the abstract classes section.',
          status: 'graded',
          attemptNumber: 1,
          submittedAt: new Date('2025-10-20T15:30:00Z'),
        },
      }),

      // CS102 Project 1 - First 3 students (Alice, Bob, Charlie)
      prisma.assessmentSubmission.create({
        data: {
          assessmentId: assessments[3].id,
          studentId: students[0].id, // Alice
          autoScore: 45,
          manualScore: 5,
          totalScore: 50,
          feedback: 'Outstanding portfolio! Beautiful design and clean code.',
          status: 'graded',
          attemptNumber: 1,
          submittedAt: new Date('2025-09-29T22:00:00Z'),
        },
      }),
      prisma.assessmentSubmission.create({
        data: {
          assessmentId: assessments[3].id,
          studentId: students[1].id, // Bob
          autoScore: 40,
          manualScore: 3,
          totalScore: 43,
          feedback: 'Great effort! Consider improving mobile responsiveness.',
          status: 'graded',
          attemptNumber: 1,
          submittedAt: new Date('2025-09-30T10:30:00Z'),
        },
      }),
      prisma.assessmentSubmission.create({
        data: {
          assessmentId: assessments[3].id,
          studentId: students[2].id, // Charlie
          autoScore: 38,
          manualScore: 0,
          totalScore: 38,
          feedback: 'Good work, but the layout needs improvement on smaller screens.',
          status: 'graded',
          attemptNumber: 1,
          submittedAt: new Date('2025-09-30T18:45:00Z'),
        },
      }),

      // CS102 Lab 3 - First 3 students
      prisma.assessmentSubmission.create({
        data: {
          assessmentId: assessments[4].id,
          studentId: students[0].id, // Alice
          autoScore: 20,
          totalScore: 20,
          feedback: 'Perfect! Excellent understanding of JavaScript fundamentals.',
          status: 'graded',
          attemptNumber: 1,
          submittedAt: new Date('2025-10-09T17:00:00Z'),
        },
      }),
      prisma.assessmentSubmission.create({
        data: {
          assessmentId: assessments[4].id,
          studentId: students[1].id, // Bob
          autoScore: 17,
          totalScore: 17,
          feedback: 'Very good! Minor issues with event handling.',
          status: 'graded',
          attemptNumber: 1,
          submittedAt: new Date('2025-10-10T09:30:00Z'),
        },
      }),
      prisma.assessmentSubmission.create({
        data: {
          assessmentId: assessments[4].id,
          studentId: students[2].id, // Charlie
          autoScore: 16,
          totalScore: 16,
          feedback: 'Good work! Review arrow functions and closures.',
          status: 'graded',
          attemptNumber: 1,
          submittedAt: new Date('2025-10-10T20:15:00Z'),
        },
      }),

      // CS201 Assignment 1 - Last 2 students (Diana, Ethan)
      prisma.assessmentSubmission.create({
        data: {
          assessmentId: assessments[5].id,
          studentId: students[3].id, // Diana
          autoScore: 23,
          manualScore: 2,
          totalScore: 25,
          feedback: 'Perfect implementation! Excellent time complexity analysis.',
          status: 'graded',
          attemptNumber: 1,
          submittedAt: new Date('2025-09-17T16:00:00Z'),
        },
      }),
      prisma.assessmentSubmission.create({
        data: {
          assessmentId: assessments[5].id,
          studentId: students[4].id, // Ethan
          autoScore: 21,
          manualScore: 1,
          totalScore: 22,
          feedback: 'Excellent work! Minor edge case not handled.',
          status: 'graded',
          attemptNumber: 1,
          submittedAt: new Date('2025-09-18T11:30:00Z'),
        },
      }),
    ])
    console.log(`✅ Created ${submissions.length} sample submissions`)

    console.log('\n🎉 Database initialization completed successfully!')
    console.log('\n📊 Summary:')
    console.log(`   - 1 primary admin (${PRIMARY_ADMIN.email})`)
    console.log(`   - ${professors.length} test professors`)
    console.log(`   - ${students.length} test students`)
    console.log(`   - ${courses.length} courses`)
    console.log(`   - ${classes.length} classes`)
    console.log(`   - ${enrollments.length} enrollments`)
    console.log(`   - ${assessments.length} assessments`)
    console.log(`   - ${submissions.length} submissions`)
  } catch (e) {
    console.error('❌ Error during database initialization:', e)
    throw e
  }
}

main()
  .catch((e) => {
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
