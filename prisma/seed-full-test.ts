import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting comprehensive seed...')

  // Clear existing data in reverse dependency order
  console.log('🧹 Cleaning database...')
  await prisma.discussionReply.deleteMany()
  await prisma.discussionPost.deleteMany()
  await prisma.assessmentSubmission.deleteMany()
  await prisma.moduleItemCompletion.deleteMany()
  await prisma.moduleCompletion.deleteMany()
  await prisma.moduleItem.deleteMany()
  await prisma.module.deleteMany()
  await prisma.enrollment.deleteMany()
  await prisma.assessmentTemplateMapping.deleteMany()
  await prisma.assessment.deleteMany()
  await prisma.moduleItemTemplate.deleteMany()
  await prisma.moduleTemplate.deleteMany()
  await prisma.assessmentTemplate.deleteMany()
  await prisma.class.deleteMany()
  await prisma.course.deleteMany()
  await prisma.user.deleteMany()

  console.log('✅ Database cleaned')

  // 1. Create Primary Admin (Nour Ali - subscriptionsnova@gmail.com)
  console.log('👤 Creating primary admin user...')
  const primaryAdmin = await prisma.user.upsert({
    where: { email: 'subscriptionsnova@gmail.com' },
    update: {},
    create: {
      email: 'subscriptionsnova@gmail.com',
      password: 'admin123', // Plain text password (system doesn't use bcrypt)
      fullName: 'Nour Ali',
      role: 'admin',
      isApproved: true,
    },
  })
  console.log('✅ Primary admin created:', primaryAdmin.email)

  // 2. Create Test Admin
  console.log('👤 Creating test admin user...')
  const admin = await prisma.user.create({
    data: {
      email: 'admin@test.com',
      password: 'admin123', // Plain text password
      fullName: 'System Admin',
      role: 'admin',
      isApproved: true,
    },
  })
  console.log('✅ Test admin created:', admin.email)

  // 3. Create Professor
  console.log('👨‍🏫 Creating professor...')
  const professor = await prisma.user.create({
    data: {
      email: 'professor@test.com',
      password: 'prof123', // Plain text password
      fullName: 'Dr. Sarah Johnson',
      role: 'professor',
      isApproved: true,
    },
  })
  console.log('✅ Professor created:', professor.email)

  // 4. Create Students
  console.log('👨‍🎓 Creating students...')
  const student1 = await prisma.user.create({
    data: {
      email: 'alice@test.com',
      password: 'student123', // Plain text password
      fullName: 'Alice Chen',
      role: 'student',
      isApproved: true,
      usernameSchoolId: 'A001',
    },
  })

  const student2 = await prisma.user.create({
    data: {
      email: 'bob@test.com',
      password: 'student123', // Plain text password
      fullName: 'Bob Martinez',
      role: 'student',
      isApproved: true,
      usernameSchoolId: 'A002',
    },
  })

  const student3 = await prisma.user.create({
    data: {
      email: 'carol@test.com',
      password: 'student123', // Plain text password
      fullName: 'Carol Davis',
      role: 'student',
      isApproved: true,
      usernameSchoolId: 'A003',
    },
  })

  console.log('✅ Students created:', [student1.email, student2.email, student3.email].join(', '))

  // 5. Create Course
  console.log('📚 Creating course...')
  const course = await prisma.course.create({
    data: {
      code: 'CS101',
      title: 'Introduction to Computer Science',
      description: 'Fundamentals of programming and computational thinking',
      subject: 'Computer Science',
      level: 'Introductory',
      isActive: true,
    },
  })
  console.log('✅ Course created:', course.code)

  // 6. Create Assessment Templates (Admin creates these)
  console.log('📋 Creating assessment templates...')

  const discussionTemplate1 = await prisma.assessmentTemplate.create({
    data: {
      title: 'Week 1 Discussion: Introduction',
      description: 'Introduce yourself and share your programming background.',
      type: 'DISCUSSION',
      courseId: course.id,
      defaultMaxPoints: 10,
      defaultSubmissionType: 'NONE',
      isActive: true,
      defaultRequirePostBeforeViewing: true,
      defaultMinimumReplyCount: 2,
      defaultAllowPeerReplies: true,
      defaultAllowAnonymous: false,
    },
  })

  const discussionTemplate2 = await prisma.assessmentTemplate.create({
    data: {
      title: 'Week 2 Discussion: Algorithms',
      description: 'Discuss your favorite sorting algorithm and explain why.',
      type: 'DISCUSSION',
      courseId: course.id,
      defaultMaxPoints: 10,
      defaultSubmissionType: 'NONE',
      isActive: true,
      defaultRequirePostBeforeViewing: true,
      defaultMinimumReplyCount: 2,
      defaultAllowPeerReplies: true,
      defaultAllowAnonymous: false,
    },
  })

  const labTemplate = await prisma.assessmentTemplate.create({
    data: {
      title: 'Python Basics Lab',
      description: 'Complete the Python exercises to practice basic syntax.',
      type: 'LAB',
      courseId: course.id,
      defaultMaxPoints: 50,
      defaultSubmissionType: 'FILE',
      isActive: true,
    },
  })

  console.log('✅ Assessment templates created:', [discussionTemplate1.title, discussionTemplate2.title, labTemplate.title].join(', '))

  // 7. Create Module Templates (Admin creates these)
  console.log('📦 Creating module templates...')

  const moduleTemplate1 = await prisma.moduleTemplate.create({
    data: {
      title: 'Getting Started',
      description: 'Welcome to CS101! Start here to learn the basics.',
      courseId: course.id,
      orderIndex: 0,
      isActive: true,
    },
  })

  const moduleTemplate2 = await prisma.moduleTemplate.create({
    data: {
      title: 'Algorithms and Problem Solving',
      description: 'Learn how to think algorithmically and solve problems.',
      courseId: course.id,
      orderIndex: 1,
      isActive: true,
    },
  })

  console.log('✅ Module templates created:', [moduleTemplate1.title, moduleTemplate2.title].join(', '))

  // 8. Create Module Item Templates with CUSTOM DESCRIPTIONS (Key for testing!)
  console.log('📝 Creating module item templates with custom descriptions...')

  // Module 1 items
  await prisma.moduleItemTemplate.create({
    data: {
      moduleTemplateId: moduleTemplate1.id,
      itemType: 'PAGE',
      title: 'Course Introduction',
      pageContent: '# Welcome to CS101\n\nThis course will teach you the fundamentals of computer science.',
      orderIndex: 0,
      isPublished: true,
      isRequired: true,
    },
  })

  await prisma.moduleItemTemplate.create({
    data: {
      moduleTemplateId: moduleTemplate1.id,
      itemType: 'ASSESSMENT',
      title: 'Introduce Yourself',
      assessmentTemplateId: discussionTemplate1.id,
      customDescription: '💬 Tell us about yourself! Share your name, major, and what excites you most about learning computer science. What programming experience do you have (if any)?',
      orderIndex: 1,
      isPublished: true,
      isRequired: true,
    },
  })

  await prisma.moduleItemTemplate.create({
    data: {
      moduleTemplateId: moduleTemplate1.id,
      itemType: 'EXTERNAL_LINK',
      title: 'Python Documentation',
      externalUrl: 'https://docs.python.org/3/',
      orderIndex: 2,
      isPublished: true,
      isRequired: false,
    },
  })

  // Module 2 items
  await prisma.moduleItemTemplate.create({
    data: {
      moduleTemplateId: moduleTemplate2.id,
      itemType: 'PAGE',
      title: 'What is an Algorithm?',
      pageContent: '# Algorithms\n\nAn algorithm is a step-by-step procedure for solving a problem.',
      orderIndex: 0,
      isPublished: true,
      isRequired: true,
    },
  })

  await prisma.moduleItemTemplate.create({
    data: {
      moduleTemplateId: moduleTemplate2.id,
      itemType: 'ASSESSMENT',
      title: 'Sorting Algorithms Discussion',
      assessmentTemplateId: discussionTemplate2.id,
      customDescription: '💬 Let\'s explore sorting algorithms! Pick ONE sorting algorithm (bubble sort, merge sort, quick sort, etc.) and explain:\n1. How it works\n2. Why you find it interesting\n3. What scenarios it\'s best suited for\n\nThen, reply to at least 2 classmates with your thoughts on their chosen algorithm.',
      orderIndex: 1,
      isPublished: true,
      isRequired: true,
    },
  })

  await prisma.moduleItemTemplate.create({
    data: {
      moduleTemplateId: moduleTemplate2.id,
      itemType: 'ASSESSMENT',
      title: 'Python Lab',
      assessmentTemplateId: labTemplate.id,
      customDescription: 'Complete the coding exercises in the attached Python file. Test your code thoroughly before submitting!',
      orderIndex: 2,
      isPublished: true,
      isRequired: true,
    },
  })

  console.log('✅ Module item templates created with custom descriptions')

  // 9. Create Professor's Class
  console.log('🏫 Creating professor\'s class...')
  const classItem = await prisma.class.create({
    data: {
      courseId: course.id,
      professorId: professor.id,
      title: 'CS101 - Spring 2025',
      classCode: 'CS101-SP25-001',
      term: 'Spring',
      year: 2025,
      section: '001',
      isActive: true,
    },
  })
  console.log('✅ Class created:', classItem.classCode)

  // 10. Clone Module Templates to Professor's Class (Course Factory)
  console.log('🔄 Cloning module templates to class...')

  const moduleTemplates = await prisma.moduleTemplate.findMany({
    where: { courseId: course.id, isActive: true },
    include: {
      items: {
        include: {
          assessmentTemplate: true,
        },
        orderBy: { orderIndex: 'asc' },
      },
    },
    orderBy: { orderIndex: 'asc' },
  })

  for (const moduleTemplate of moduleTemplates) {
    // Create module in class
    const module = await prisma.module.create({
      data: {
        classId: classItem.id,
        title: moduleTemplate.title,
        description: moduleTemplate.description,
        orderIndex: moduleTemplate.orderIndex,
        isPublished: true,
      },
    })

    console.log(`  📦 Created module: ${module.title}`)

    // Create assessments and module items
    for (const itemTemplate of moduleTemplate.items) {
      let assessmentId: string | null = null

      if (itemTemplate.itemType === 'ASSESSMENT' && itemTemplate.assessmentTemplate) {
        // Create assessment from template
        const template = itemTemplate.assessmentTemplate
        const slug = template.title
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .trim()

        const assessment = await prisma.assessment.create({
          data: {
            classId: classItem.id,
            title: template.title,
            slug,
            description: template.description,
            type: template.type,
            maxPoints: template.defaultMaxPoints,
            submissionType: template.defaultSubmissionType,
            dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
            requirePostBeforeViewing: template.requirePostBeforeViewing ?? false,
            minimumReplyCount: template.minimumReplyCount,
            allowPeerReplies: template.allowPeerReplies ?? false,
            allowAnonymous: template.allowAnonymous ?? false,
            orderIndex: itemTemplate.orderIndex,
          },
        })

        assessmentId = assessment.id

        // Create mapping
        await prisma.assessmentTemplateMapping.create({
          data: {
            classId: classItem.id,
            assessmentId: assessment.id,
            assessmentTemplateId: template.id,
          },
        })

        console.log(`    📋 Created assessment: ${assessment.title}`)
      }

      // Create module item
      await prisma.moduleItem.create({
        data: {
          moduleId: module.id,
          itemType: itemTemplate.itemType,
          title: itemTemplate.title,
          assessmentId,
          externalUrl: itemTemplate.externalUrl,
          pageContent: itemTemplate.pageContent,
          customDescription: itemTemplate.customDescription, // KEY: Preserve custom description!
          orderIndex: itemTemplate.orderIndex,
          isPublished: itemTemplate.isPublished,
          isRequired: itemTemplate.isRequired,
        },
      })

      console.log(`    ✓ Created module item: ${itemTemplate.title}${itemTemplate.customDescription ? ' (with custom description)' : ''}`)
    }
  }

  console.log('✅ Modules cloned successfully')

  // 11. Enroll Students
  console.log('📝 Enrolling students...')
  const students = [student1, student2, student3]

  for (const student of students) {
    await prisma.enrollment.create({
      data: {
        studentId: student.id,
        classId: classItem.id,
        status: 'active',
      },
    })
    console.log(`  ✅ Enrolled: ${student.fullName}`)
  }

  // 12. Create Discussion Posts and Replies
  console.log('💬 Creating discussion posts...')

  // Get discussion assessments
  const discussions = await prisma.assessment.findMany({
    where: {
      classId: classItem.id,
      type: 'DISCUSSION',
    },
    orderBy: { orderIndex: 'asc' },
  })

  if (discussions.length > 0) {
    const firstDiscussion = discussions[0]

    // Alice posts
    const alicePost = await prisma.discussionPost.create({
      data: {
        assessmentId: firstDiscussion.id,
        classId: classItem.id,
        studentId: student1.id,
        content: 'Hi everyone! I\'m Alice Chen, majoring in Computer Science. I\'m super excited to learn programming because I love solving puzzles and building things. I have some basic Python experience from a summer workshop.',
      },
    })

    // Create Alice's submission
    await prisma.assessmentSubmission.create({
      data: {
        studentId: student1.id,
        assessmentId: firstDiscussion.id,
        classId: classItem.id,
        status: 'SUBMITTED',
        discussionPostId: alicePost.id,
        discussionReplyCount: 0,
        submittedAt: new Date(),
      },
    })

    // Bob posts
    const bobPost = await prisma.discussionPost.create({
      data: {
        assessmentId: firstDiscussion.id,
        classId: classItem.id,
        studentId: student2.id,
        content: 'Hey! Bob here. I\'m an Engineering major taking CS as an elective. I\'ve dabbled in JavaScript for web stuff but want to get more serious about programming. Looking forward to this class!',
      },
    })

    // Create Bob's submission
    const bobSubmission = await prisma.assessmentSubmission.create({
      data: {
        studentId: student2.id,
        assessmentId: firstDiscussion.id,
        classId: classItem.id,
        status: 'SUBMITTED',
        discussionPostId: bobPost.id,
        discussionReplyCount: 0,
        submittedAt: new Date(),
      },
    })

    // Alice replies to Bob
    await prisma.discussionReply.create({
      data: {
        assessmentId: firstDiscussion.id,
        classId: classItem.id,
        authorId: student1.id,
        postId: bobPost.id,
        content: 'That\'s cool Bob! JavaScript is a great starting point. Have you tried any frameworks like React?',
      },
    })

    // Update Bob's submission reply count
    await prisma.assessmentSubmission.update({
      where: { id: bobSubmission.id },
      data: { discussionReplyCount: { increment: 1 } },
    })

    // Bob replies to Alice
    await prisma.discussionReply.create({
      data: {
        assessmentId: firstDiscussion.id,
        classId: classItem.id,
        authorId: student2.id,
        postId: alicePost.id,
        content: 'Nice Alice! Python is super versatile. I heard it\'s great for data science too.',
      },
    })

    console.log('✅ Discussion posts and replies created')
  }

  // 13. Mark some module items as complete
  console.log('✓ Marking module items as complete...')

  const modules = await prisma.module.findMany({
    where: { classId: classItem.id },
    include: { items: true },
  })

  for (const module of modules) {
    for (const item of module.items.slice(0, 1)) { // Complete first item of each module
      for (const student of [student1, student2]) {
        await prisma.moduleItemCompletion.create({
          data: {
            moduleItemId: item.id,
            studentId: student.id,
            classId: classItem.id,
            completedAt: new Date(),
          },
        })
      }
    }
  }

  console.log('✅ Module item completions created')

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('🎉 SEED COMPLETED SUCCESSFULLY!')
  console.log('='.repeat(60))
  console.log('\n📊 Summary:')
  console.log(`   👤 Primary Admin: ${primaryAdmin.email} / admin123`)
  console.log(`   👤 Test Admin: ${admin.email} / admin123`)
  console.log(`   👨‍🏫 Professor: ${professor.email} / prof123`)
  console.log(`   👨‍🎓 Students:`)
  console.log(`      - ${student1.email} / student123`)
  console.log(`      - ${student2.email} / student123`)
  console.log(`      - ${student3.email} / student123`)
  console.log(`   📚 Course: ${course.code} - ${course.title}`)
  console.log(`   🏫 Class: ${classItem.classCode}`)
  console.log(`   📦 Modules: ${modules.length}`)
  console.log(`   💬 Discussions with custom descriptions: 2`)
  console.log(`   📋 Discussion posts: 2 (with 2 replies)`)
  console.log('\n🧪 Testing the Flow:')
  console.log('   1. Login as subscriptionsnova@gmail.com (your primary admin) or admin@test.com')
  console.log('   2. Login as professor@test.com to see class with modules')
  console.log('   3. Login as alice@test.com to see modules with custom discussion prompts')
  console.log('   4. Check gradebook as professor - module indicators should show')
  console.log('   5. Check /student/assignments as alice - discussions should show custom descriptions')
  console.log('\n' + '='.repeat(60) + '\n')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
