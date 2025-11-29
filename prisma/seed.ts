// Seed script for database initialization with proper template workflow
import { PrismaClient } from '@prisma/client'
import { createAssessmentsFromTemplates } from '../lib/assessment-templates'
import { createModulesFromTemplates } from '../lib/module-templates'

// Create Prisma client
const prisma = new PrismaClient()

// Primary admin user configuration
const PRIMARY_ADMIN = {
  email: 'subscriptionsnova@gmail.com',
  password: 'admin123', // Plain-text password
  fullName: 'Nour Ali',
  role: 'admin',
}

async function ensurePrimaryAdmin() {
  // Check if primary admin exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: PRIMARY_ADMIN.email },
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
  console.log('🌱 Starting database initialization with proper template workflow...')

  try {
    // Step 1: Ensure primary admin always exists
    console.log('\n📋 Checking primary admin user...')
    await ensurePrimaryAdmin()

    // Step 2: Clean test data (preserve primary admin)
    console.log('\n🧹 Cleaning test data...')
    await prisma.moduleItemTemplateMapping.deleteMany()
    await prisma.moduleTemplateMapping.deleteMany()
    await prisma.assessmentTemplateMapping.deleteMany()
    await prisma.moduleItemCompletion.deleteMany()
    await prisma.moduleCompletion.deleteMany()
    await prisma.discussionReply.deleteMany()
    await prisma.discussionPost.deleteMany()
    await prisma.assessmentSubmission.deleteMany()
    await prisma.moduleItem.deleteMany()
    await prisma.module.deleteMany()
    await prisma.assessment.deleteMany()
    await prisma.enrollment.deleteMany()
    await prisma.class.deleteMany()
    await prisma.moduleItemTemplate.deleteMany()
    await prisma.moduleTemplate.deleteMany()
    await prisma.assessmentTemplate.deleteMany()
    await prisma.course.deleteMany()
    await prisma.user.deleteMany({
      where: { email: { not: PRIMARY_ADMIN.email } },
    })
    console.log('✅ Cleaned test data (preserved primary admin)')

    // Step 3: Create courses
    console.log('\n📚 Creating courses...')
    const courses = await Promise.all([
      prisma.course.create({
        data: {
          code: 'CS101',
          title: 'Introduction to Java Programming',
          description:
            'Learn the fundamentals of Java programming including OOP concepts, data structures, and algorithms.',
          subject: 'Computer Science',
          level: 'Introductory',
          isActive: true,
        },
      }),
      prisma.course.create({
        data: {
          code: 'CS102',
          title: 'Web Development Fundamentals',
          description: 'Learn HTML, CSS, JavaScript, and modern web development frameworks.',
          subject: 'Computer Science',
          level: 'Introductory',
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

    // Step 4: Create assessment templates
    console.log('\n📝 Creating assessment templates...')
    const assessmentTemplates = await Promise.all([
      // CS101 Templates
      prisma.assessmentTemplate.create({
        data: {
          courseId: courses[0].id,
          title: 'Weekly Lab Assignment',
          description: 'Standard weekly programming lab',
          type: 'LAB',
          defaultMaxPoints: 15,
          defaultSubmissionType: 'BOTH',
          orderIndex: 1,
          isActive: true,
        },
      }),
      prisma.assessmentTemplate.create({
        data: {
          courseId: courses[0].id,
          title: 'Weekly Discussion: Programming Background',
          description: `What are your first impressions of programming and Java?

Share your background:
- Have you programmed before? If so, in what languages?
- What motivated you to take this course?
- What do you hope to learn or accomplish by the end of the semester?
- What aspects of programming seem most interesting or challenging to you?

Your initial post should be 150-200 words. Then, read and respond thoughtfully to at least 2 of your classmates' posts.`,
          type: 'DISCUSSION',
          defaultMaxPoints: 5,
          defaultSubmissionType: 'NONE',
          defaultAllowPeerReplies: true,
          defaultMinimumReplyCount: 2,
          defaultAutoCompleteEnabled: true,
          defaultRequirePostBeforeViewing: true,
          orderIndex: 2,
          isActive: true,
        },
      }),
      prisma.assessmentTemplate.create({
        data: {
          courseId: courses[0].id,
          title: 'Interactive Coding Exercise',
          description: 'Guided interactive coding lesson',
          type: 'INTERACTIVE_LESSON',
          defaultMaxPoints: 10,
          defaultSubmissionType: 'NONE',
          orderIndex: 3,
          isActive: true,
        },
      }),
      prisma.assessmentTemplate.create({
        data: {
          courseId: courses[0].id,
          title: 'Midterm Exam',
          description: 'Comprehensive midterm examination',
          type: 'EXAM',
          defaultMaxPoints: 100,
          defaultSubmissionType: 'BOTH',
          orderIndex: 4,
          isActive: true,
        },
      }),
      // CS102 Templates
      prisma.assessmentTemplate.create({
        data: {
          courseId: courses[1].id,
          title: 'Web Development Project',
          description: 'Build a web application component',
          type: 'LAB',
          defaultMaxPoints: 50,
          defaultSubmissionType: 'BOTH',
          orderIndex: 1,
          isActive: true,
        },
      }),
      prisma.assessmentTemplate.create({
        data: {
          courseId: courses[1].id,
          title: 'Discussion: Modern Web Technologies',
          description: `Research and discuss a modern web technology or framework.

Choose ONE of the following topics to research and discuss:
1. React vs Vue vs Angular - Which framework would you choose and why?
2. The importance of web accessibility (WCAG guidelines)
3. Progressive Web Apps (PWAs) vs Native Apps
4. CSS Grid vs Flexbox - When to use which?
5. The role of TypeScript in modern web development

Your post should include:
- A brief explanation of the technology/concept
- Its benefits and potential drawbacks
- A real-world use case or example
- Your personal opinion or experience (if any)

Minimum 200 words. Reply to at least 3 classmates who chose different topics than you.`,
          type: 'DISCUSSION',
          defaultMaxPoints: 10,
          defaultSubmissionType: 'NONE',
          defaultAllowPeerReplies: true,
          defaultMinimumReplyCount: 3,
          orderIndex: 2,
          isActive: true,
        },
      }),
      // CS201 Templates
      prisma.assessmentTemplate.create({
        data: {
          courseId: courses[2].id,
          title: 'Algorithm Implementation Lab',
          description: 'Implement and analyze algorithms',
          type: 'LAB',
          defaultMaxPoints: 25,
          defaultSubmissionType: 'BOTH',
          orderIndex: 1,
          isActive: true,
        },
      }),
      prisma.assessmentTemplate.create({
        data: {
          courseId: courses[2].id,
          title: 'Discussion: Algorithm Complexity Analysis',
          description: `Explain Big-O notation and analyze algorithm complexity.

Part 1 - Explain the concept:
Explain in your own words what Big-O notation represents. Why is it important in computer science?

Part 2 - Provide examples:
Give TWO real-world examples of algorithms with different time complexities (e.g., O(1), O(n), O(n²), O(log n)).
For each example:
- Name the algorithm or operation
- Explain its time complexity
- Describe a scenario where this complexity matters

Part 3 - Critical thinking:
When might you choose a slower algorithm over a faster one? Consider factors beyond just Big-O notation.

Minimum 250 words. Reply to at least 2 classmates, either adding to their examples or respectfully challenging their analysis.`,
          type: 'DISCUSSION',
          defaultMaxPoints: 5,
          defaultSubmissionType: 'NONE',
          defaultAllowPeerReplies: true,
          defaultMinimumReplyCount: 2,
          orderIndex: 2,
          isActive: true,
        },
      }),
    ])
    console.log(`✅ Created ${assessmentTemplates.length} assessment templates`)

    // Step 5: Create module templates
    console.log('\n📚 Creating module templates...')
    const moduleTemplates = await Promise.all([
      // CS101 Module Templates
      prisma.moduleTemplate.create({
        data: {
          courseId: courses[0].id,
          title: 'Week 1: Introduction to Java',
          description: 'Getting started with Java programming',
          orderIndex: 1,
          isActive: true,
        },
      }),
      prisma.moduleTemplate.create({
        data: {
          courseId: courses[0].id,
          title: 'Week 2: Variables and Data Types',
          description: 'Understanding primitive and reference types',
          orderIndex: 2,
          isActive: true,
        },
      }),
      prisma.moduleTemplate.create({
        data: {
          courseId: courses[0].id,
          title: 'Week 3: Control Flow',
          description: 'Conditionals and loops',
          orderIndex: 3,
          isActive: true,
        },
      }),
      // CS102 Module Templates
      prisma.moduleTemplate.create({
        data: {
          courseId: courses[1].id,
          title: 'Week 1: HTML & CSS Basics',
          description: 'Introduction to web markup and styling',
          orderIndex: 1,
          isActive: true,
        },
      }),
      prisma.moduleTemplate.create({
        data: {
          courseId: courses[1].id,
          title: 'Week 2: JavaScript Fundamentals',
          description: 'Learn JavaScript basics and DOM manipulation',
          orderIndex: 2,
          isActive: true,
        },
      }),
      // CS201 Module Templates
      prisma.moduleTemplate.create({
        data: {
          courseId: courses[2].id,
          title: 'Week 1: Arrays and Lists',
          description: 'Basic data structures',
          orderIndex: 1,
          isActive: true,
        },
      }),
    ])
    console.log(`✅ Created ${moduleTemplates.length} module templates`)

    // Step 6: Create module item templates
    console.log('\n📋 Creating module item templates...')
    const moduleItemTemplates = await Promise.all([
      // CS101 Week 1 Items
      prisma.moduleItemTemplate.create({
        data: {
          moduleTemplateId: moduleTemplates[0].id,
          itemType: 'PAGE',
          title: 'Course Welcome & Syllabus',
          pageContent:
            '# Welcome to CS101!\n\nThis course introduces fundamental programming concepts using Java.',
          orderIndex: 1,
          isPublished: true,
          isRequired: true,
        },
      }),
      prisma.moduleItemTemplate.create({
        data: {
          moduleTemplateId: moduleTemplates[0].id,
          itemType: 'EXTERNAL_LINK',
          title: 'Revel Chapter 1: Introduction',
          externalUrl: 'https://revel.pearson.com/courses/chapter1',
          orderIndex: 2,
          isPublished: true,
          isRequired: true,
        },
      }),
      prisma.moduleItemTemplate.create({
        data: {
          moduleTemplateId: moduleTemplates[0].id,
          itemType: 'ASSESSMENT',
          title: 'Lab 1: Hello World',
          assessmentTemplateId: assessmentTemplates[0].id, // Weekly Lab
          orderIndex: 3,
          isPublished: true,
          isRequired: true,
        },
      }),
      prisma.moduleItemTemplate.create({
        data: {
          moduleTemplateId: moduleTemplates[0].id,
          itemType: 'ASSESSMENT',
          title: 'Discussion: First Impressions of Java',
          assessmentTemplateId: assessmentTemplates[1].id, // Discussion template
          orderIndex: 4,
          isPublished: true,
          isRequired: true,
        },
      }),
      // CS101 Week 2 Items
      prisma.moduleItemTemplate.create({
        data: {
          moduleTemplateId: moduleTemplates[1].id,
          itemType: 'PAGE',
          title: 'Data Types Overview',
          pageContent: '# Java Data Types\n\nLearn about primitive and reference types in Java.',
          orderIndex: 1,
          isPublished: true,
          isRequired: true,
        },
      }),
      prisma.moduleItemTemplate.create({
        data: {
          moduleTemplateId: moduleTemplates[1].id,
          itemType: 'ASSESSMENT',
          title: 'Lab 2: Variables Practice',
          assessmentTemplateId: assessmentTemplates[0].id, // Weekly Lab
          orderIndex: 2,
          isPublished: true,
          isRequired: true,
        },
      }),
      // CS102 Week 1 Items
      prisma.moduleItemTemplate.create({
        data: {
          moduleTemplateId: moduleTemplates[3].id,
          itemType: 'PAGE',
          title: 'HTML Basics',
          pageContent: '# HTML Introduction\n\nLearn the structure of HTML documents.',
          orderIndex: 1,
          isPublished: true,
          isRequired: true,
        },
      }),
      prisma.moduleItemTemplate.create({
        data: {
          moduleTemplateId: moduleTemplates[3].id,
          itemType: 'ASSESSMENT',
          title: 'Project 1: Personal Website',
          assessmentTemplateId: assessmentTemplates[4].id, // Web Dev Project
          orderIndex: 2,
          isPublished: true,
          isRequired: true,
        },
      }),
    ])
    console.log(`✅ Created ${moduleItemTemplates.length} module item templates`)

    // Step 7: Create professors
    console.log('\n👨‍🏫 Creating professors...')
    const professors = await Promise.all([
      prisma.user.create({
        data: {
          email: 'john.smith@professor.edu',
          password: 'prof123',
          role: 'professor',
          fullName: 'Dr. John Smith',
          usernameSchoolId: '100001',
          isApproved: true,
        },
      }),
      prisma.user.create({
        data: {
          email: 'sarah.johnson@professor.edu',
          password: 'prof123',
          role: 'professor',
          fullName: 'Dr. Sarah Johnson',
          usernameSchoolId: '100002',
          isApproved: true,
        },
      }),
    ])
    console.log(`✅ Created ${professors.length} professors`)

    // Step 8: Create students
    console.log('\n👨‍🎓 Creating students...')
    const students = await Promise.all([
      prisma.user.create({
        data: {
          email: 'alice.anderson@student.edu',
          password: 'student123',
          role: 'student',
          fullName: 'Alice Anderson',
          usernameSchoolId: '200001',
          isApproved: true,
        },
      }),
      prisma.user.create({
        data: {
          email: 'bob.brown@student.edu',
          password: 'student123',
          role: 'student',
          fullName: 'Bob Brown',
          usernameSchoolId: '200002',
          isApproved: true,
        },
      }),
      prisma.user.create({
        data: {
          email: 'charlie.clark@student.edu',
          password: 'student123',
          role: 'student',
          fullName: 'Charlie Clark',
          usernameSchoolId: '200003',
          isApproved: true,
        },
      }),
      prisma.user.create({
        data: {
          email: 'diana.davis@student.edu',
          password: 'student123',
          role: 'student',
          fullName: 'Diana Davis',
          usernameSchoolId: '200004',
          isApproved: true,
        },
      }),
    ])
    console.log(`✅ Created ${students.length} students`)

    // Step 9: Create classes and auto-clone templates
    console.log('\n🏫 Creating classes...')
    const classes = await Promise.all([
      // Prof Smith's CS101 class
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
      // Prof Johnson's CS102 class
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
      // Prof Smith's CS201 class
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

    // Step 10: Clone assessment templates to actual assessments
    console.log('\n📋 Cloning assessment templates to classes...')
    for (const cls of classes) {
      const assessmentCount = await createAssessmentsFromTemplates(cls.id, cls.courseId)
      console.log(`   ✅ Created ${assessmentCount} assessments for ${cls.title}`)
    }

    // Step 11: Clone module templates to actual modules
    console.log('\n📦 Cloning module templates to classes...')
    for (const cls of classes) {
      const moduleCount = await createModulesFromTemplates(cls.id, cls.courseId)
      console.log(`   ✅ Created ${moduleCount} modules for ${cls.title}`)
    }

    // Step 12: Create enrollments
    console.log('\n📚 Creating enrollments...')
    const enrollments = await Promise.all([
      // CS101 enrollments
      prisma.enrollment.create({
        data: { classId: classes[0].id, studentId: students[0].id, status: 'active' },
      }),
      prisma.enrollment.create({
        data: { classId: classes[0].id, studentId: students[1].id, status: 'active' },
      }),
      prisma.enrollment.create({
        data: { classId: classes[0].id, studentId: students[2].id, status: 'active' },
      }),
      // CS102 enrollments
      prisma.enrollment.create({
        data: { classId: classes[1].id, studentId: students[1].id, status: 'active' },
      }),
      prisma.enrollment.create({
        data: { classId: classes[1].id, studentId: students[3].id, status: 'active' },
      }),
      // CS201 enrollments
      prisma.enrollment.create({
        data: { classId: classes[2].id, studentId: students[2].id, status: 'active' },
      }),
      prisma.enrollment.create({
        data: { classId: classes[2].id, studentId: students[3].id, status: 'active' },
      }),
    ])
    console.log(`✅ Created ${enrollments.length} enrollments`)

    // Step 13: Get cloned assessments for creating submissions
    console.log('\n📝 Fetching cloned assessments...')
    const cs101Assessments = await prisma.assessment.findMany({
      where: { classId: classes[0].id },
      orderBy: { orderIndex: 'asc' },
    })
    const cs102Assessments = await prisma.assessment.findMany({
      where: { classId: classes[1].id },
      orderBy: { orderIndex: 'asc' },
    })
    console.log(
      `✅ Found ${cs101Assessments.length} CS101 assessments, ${cs102Assessments.length} CS102 assessments`
    )

    // Step 14: Create sample discussion posts
    console.log('\n💬 Creating sample discussion posts...')
    const discussionAssessments = cs101Assessments.filter((a) => a.type === 'DISCUSSION')
    if (discussionAssessments.length > 0) {
      const discussionPosts = await Promise.all([
        prisma.discussionPost.create({
          data: {
            assessmentId: discussionAssessments[0].id,
            classId: classes[0].id,
            studentId: students[0].id,
            content:
              'Java seems really powerful! I love how strongly typed it is compared to Python.',
          },
        }),
        prisma.discussionPost.create({
          data: {
            assessmentId: discussionAssessments[0].id,
            classId: classes[0].id,
            studentId: students[1].id,
            content: 'The syntax takes some getting used to, but I can see the benefits.',
          },
        }),
      ])
      console.log(`✅ Created ${discussionPosts.length} discussion posts`)

      // Create replies
      const discussionReplies = await Promise.all([
        prisma.discussionReply.create({
          data: {
            assessmentId: discussionAssessments[0].id,
            classId: classes[0].id,
            authorId: students[2].id,
            postId: discussionPosts[0].id,
            content: 'I agree! The type safety helps catch errors early.',
          },
        }),
        prisma.discussionReply.create({
          data: {
            assessmentId: discussionAssessments[0].id,
            classId: classes[0].id,
            authorId: students[0].id,
            postId: discussionPosts[1].id,
            content: 'It gets easier with practice. The IDE helps a lot!',
          },
        }),
      ])
      console.log(`✅ Created ${discussionReplies.length} discussion replies`)
    }

    // Step 15: Create sample lab submissions
    console.log('\n📤 Creating sample submissions...')
    const labAssessments = cs101Assessments.filter((a) => a.type === 'LAB')
    if (labAssessments.length > 0) {
      const submissions = await Promise.all([
        prisma.assessmentSubmission.create({
          data: {
            assessmentId: labAssessments[0].id,
            studentId: students[0].id,
            classId: classes[0].id,
            submissionText: 'Completed the Hello World assignment.',
            status: 'GRADED',
            manualScore: 15,
            totalScore: 15,
            feedback: 'Perfect! Great work on your first Java program.',
          },
        }),
        prisma.assessmentSubmission.create({
          data: {
            assessmentId: labAssessments[0].id,
            studentId: students[1].id,
            classId: classes[0].id,
            submissionText: 'Here is my Hello World program.',
            status: 'GRADED',
            manualScore: 14,
            totalScore: 14,
            feedback: 'Good work! Minor style issues.',
          },
        }),
        prisma.assessmentSubmission.create({
          data: {
            assessmentId: labAssessments[0].id,
            studentId: students[2].id,
            classId: classes[0].id,
            submissionText: 'Submitted my lab assignment.',
            status: 'SUBMITTED',
          },
        }),
      ])
      console.log(`✅ Created ${submissions.length} lab submissions`)
    }

    console.log('\n✅ Database seeded successfully with proper template workflow!')
    console.log('\n📊 Summary:')
    console.log(`   • ${courses.length} courses with templates`)
    console.log(`   • ${assessmentTemplates.length} assessment templates`)
    console.log(`   • ${moduleTemplates.length} module templates`)
    console.log(`   • ${professors.length} professors`)
    console.log(`   • ${students.length} students`)
    console.log(`   • ${classes.length} classes`)
    console.log(`   • Assessments and modules auto-cloned from templates`)
    console.log(`   • ${enrollments.length} student enrollments`)
    console.log('\n🎯 Workflow demonstrated:')
    console.log('   1. Admin creates course templates (assessments + modules)')
    console.log('   2. Professors adopt courses → templates auto-clone to classes')
    console.log('   3. Students enroll and can see modules with assessments')
    console.log('   4. Students submit work and participate in discussions')
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .then(() => {
    console.log('\n✅ Seed script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Seed script failed:', error)
    process.exit(1)
  })
