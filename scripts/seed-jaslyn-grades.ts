import { db } from '../lib/db'

async function seedJaslynGrades() {
  try {
    console.log('🌱 Starting to seed Jaslyn\'s grades...')

    // Find Jaslyn
    const jaslyn = await db.user.findFirst({
      where: {
        OR: [
          { email: { contains: 'jaslyn', mode: 'insensitive' } },
          { fullName: { contains: 'jaslyn', mode: 'insensitive' } },
        ],
        role: 'student',
      },
    })

    if (!jaslyn) {
      console.error('❌ Jaslyn not found!')
      return
    }

    console.log(`✅ Found Jaslyn: ${jaslyn.email}`)

    // Get Jaslyn's enrolled classes
    const enrollments = await db.enrollment.findMany({
      where: {
        studentId: jaslyn.id,
        status: 'active',
      },
      include: {
        class: {
          include: {
            course: true,
          },
        },
      },
    })

    if (enrollments.length === 0) {
      console.error('❌ Jaslyn is not enrolled in any classes!')
      return
    }

    console.log(`✅ Found ${enrollments.length} enrolled classes`)

    // Assessment templates for each type
    const assessmentTemplates = {
      INTERACTIVE_LESSON: [
        { title: 'Introduction to Data Structures', maxPoints: 100 },
        { title: 'Understanding Algorithms', maxPoints: 100 },
        { title: 'Object-Oriented Programming Basics', maxPoints: 100 },
        { title: 'Database Design Fundamentals', maxPoints: 100 },
        { title: 'Web Development Concepts', maxPoints: 100 },
      ],
      LAB: [
        { title: 'Lab 1: Binary Search Implementation', maxPoints: 150 },
        { title: 'Lab 2: Linked List Operations', maxPoints: 150 },
        { title: 'Lab 3: Tree Traversal', maxPoints: 150 },
        { title: 'Lab 4: Hash Table Implementation', maxPoints: 150 },
        { title: 'Lab 5: Sorting Algorithms', maxPoints: 200 },
        { title: 'Lab 6: Graph Algorithms', maxPoints: 200 },
      ],
      EXAM: [
        { title: 'Midterm Exam 1', maxPoints: 200 },
        { title: 'Midterm Exam 2', maxPoints: 200 },
        { title: 'Final Exam', maxPoints: 300 },
      ],
      QUIZ: [
        { title: 'Quiz 1: Complexity Analysis', maxPoints: 50 },
        { title: 'Quiz 2: Recursion', maxPoints: 50 },
        { title: 'Quiz 3: Dynamic Programming', maxPoints: 50 },
        { title: 'Quiz 4: Greedy Algorithms', maxPoints: 50 },
        { title: 'Quiz 5: Divide and Conquer', maxPoints: 50 },
        { title: 'Quiz 6: Backtracking', maxPoints: 50 },
        { title: 'Quiz 7: Graph Theory', maxPoints: 50 },
        { title: 'Quiz 8: Memory Management', maxPoints: 50 },
      ],
      DISCUSSION: [
        { title: 'Discussion: Ethics in Computing', maxPoints: 75 },
        { title: 'Discussion: Open Source vs Proprietary', maxPoints: 75 },
        { title: 'Discussion: Future of AI', maxPoints: 75 },
        { title: 'Discussion: Software Development Life Cycle', maxPoints: 75 },
      ],
    }

    // Generate dates throughout the year
    const generateRandomDate = (startDate: Date, endDate: Date) => {
      return new Date(
        startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime())
      )
    }

    const yearStart = new Date('2024-09-01')
    const yearEnd = new Date('2025-05-31')

    let totalAssessments = 0
    let totalSubmissions = 0

    // For each enrolled class
    for (const enrollment of enrollments) {
      console.log(`\n📚 Processing class: ${enrollment.class.course.code}`)

      // Create assessments for each type
      for (const [type, templates] of Object.entries(assessmentTemplates)) {
        console.log(`  Creating ${type} assessments...`)

        for (const template of templates) {
          const dueDate = generateRandomDate(yearStart, yearEnd)
          const submittedDate = new Date(dueDate.getTime() - Math.random() * 2 * 24 * 60 * 60 * 1000) // 0-2 days before due
          const gradedDate = new Date(submittedDate.getTime() + Math.random() * 5 * 24 * 60 * 60 * 1000) // 0-5 days after submit

          // Generate slug from title
          const slug = template.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')

          // Create assessment
          const assessment = await db.assessment.create({
            data: {
              classId: enrollment.classId,
              title: template.title,
              slug: slug,
              description: `This is a ${type.toLowerCase().replace('_', ' ')} assignment covering important course concepts.`,
              type: type as any,
              submissionType: type === 'INTERACTIVE_LESSON' ? 'NONE' : 'BOTH',
              maxPoints: template.maxPoints,
              dueAt: dueDate,
              allowMultipleAttempts: false,
              maxAttempts: 1,
            },
          })

          totalAssessments++

          // Generate a good grade (between 85% and 98%)
          const percentage = 85 + Math.random() * 13 // 85-98%
          const score = (template.maxPoints * percentage) / 100

          // Create graded submission
          const submissionData: any = {
            assessmentId: assessment.id,
            studentId: jaslyn.id,
            attemptNumber: 1,
            submissionText: type === 'DISCUSSION'
              ? 'This is my thoughtful response to the discussion prompt. I believe that...'
              : 'Assignment completed successfully.',
            status: 'GRADED',
            totalScore: parseFloat(score.toFixed(1)),
            submittedAt: submittedDate,
            feedback: percentage >= 95
              ? 'Excellent work! You demonstrated a strong understanding of the material.'
              : percentage >= 90
              ? 'Great job! Keep up the good work.'
              : 'Good effort. Review the feedback comments for areas of improvement.',
            isLate: false,
          }

          if (type === 'LAB' || type === 'EXAM') {
            submissionData.submissionFiles = JSON.stringify([
              {
                fileName: `${template.title.replace(/[^a-zA-Z0-9]/g, '_')}.zip`,
                fileSize: Math.floor(Math.random() * 1000000) + 50000,
                fileType: 'application/zip',
                uploadedAt: submittedDate.toISOString(),
              },
            ])
          }

          const submission = await db.assessmentSubmission.create({
            data: submissionData,
          })

          totalSubmissions++
        }
      }
    }

    console.log('\n✅ Seeding complete!')
    console.log(`📊 Total assessments created: ${totalAssessments}`)
    console.log(`📝 Total submissions created: ${totalSubmissions}`)
    console.log(`🎓 Average expected grade: ~91% (A-)`)
  } catch (error) {
    console.error('❌ Error seeding grades:', error)
    throw error
  } finally {
    await db.$disconnect()
  }
}

seedJaslynGrades()
  .then(() => {
    console.log('✅ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })
