# Testing Role-Based Dashboards

## Overview

Three role-based dashboards have been created with real Prisma data queries and role-based access control:

- **Admin Dashboard**: `/admin` - Full platform overview
- **Professor Dashboard**: `/professor` - Professor's classes and submissions
- **Student Dashboard**: `/student` - Student's classes and assessments

## Role-Based Access Pattern

All dashboards use the same role-based gating pattern from `lib/auth.ts`:

```typescript
// In layout.tsx for each role
const user = await requireAdmin()  // or requireProfessor() / requireStudent()

if (!user) {
  redirect('/')  // Redirect unauthorized users
}
```

The auth utilities:
- `getCurrentUser()` - Gets current user from Clerk
- `requireRole(role)` - Checks if user has specific role
- `requireAdmin()` / `requireProfessor()` / `requireStudent()` - Role-specific helpers

## Testing Steps

### 1. Seed the Database

Run the seed API endpoint to populate test data:

```bash
curl -X POST http://localhost:3000/api/seed
```

Or visit `http://localhost:3000/api/seed` in your browser after starting the dev server.

This creates:
- 1 primary admin (your actual Clerk account)
- 2 test professors
- 3 test students
- 2 courses (CS101, CS102)
- 2 classes
- Multiple enrollments
- 3 assessments
- 3 sample submissions

### 2. Access Dashboards by Role

**Admin Dashboard:**
- URL: `http://localhost:3000/admin`
- Login with admin account: `subscriptionnova@gmail.com`
- Shows:
  - User counts by role (admin/professor/student)
  - Total courses, classes, enrollments, assessments
  - Table of all classes with professor names

**Professor Dashboard:**
- URL: `http://localhost:3000/professor`
- Login with test professor: `prof.smith@cslearning.edu` or `prof.johnson@cslearning.edu`
- Shows:
  - Professor's classes only
  - Student count per class
  - Recent submissions from their students

**Student Dashboard:**
- URL: `http://localhost:3000/student`
- Login with test student: `alice.wonder@student.cslearning.edu` or `bob.builder@student.cslearning.edu`
- Shows:
  - Student's enrolled classes
  - Upcoming assessments (not yet submitted)
  - Recent submissions with scores and feedback

### 3. Verify Role-Based Access

Try accessing dashboards with wrong roles:
- Admin visiting `/professor` → should redirect to `/`
- Professor visiting `/student` → should redirect to `/`
- Student visiting `/admin` → should redirect to `/`

### 4. Verify Data from Prisma

Check that the data displayed matches the seed data:
- Class codes like `CSLEARN-CS101-FA25-01`
- Professor names: Dr. Sarah Smith, Dr. Michael Johnson
- Student names: Alice Wonderland, Bob Builder, Charlie Brown
- Assessment titles: "Lab 1: Hello World", "Lab 2: Variables and Data Types"
- Scores: 10/10, 15/15, etc.

## Dashboard Features

### Admin Dashboard (`/app/admin/page.tsx`)
- Statistics cards showing counts
- Classes table with:
  - Class code
  - Title
  - Term/Year
  - Professor name
  - Enrollment count
  - Assessment count

### Professor Dashboard (`/app/professor/page.tsx`)
- Statistics: My Classes, Total Students, Assessments
- Classes table filtered by professorId
- Recent submissions from students in their classes

### Student Dashboard (`/app/student/page.tsx`)
- Statistics: Enrolled Classes, Submissions, Average Score
- List of enrolled classes with course details
- Upcoming assessments (not submitted yet)
- Recent submissions with scores and feedback

## Prisma Queries Used

All dashboards fetch data server-side using Prisma:

```typescript
// Example from admin dashboard
const totalUsers = await db.user.count()
const classes = await db.class.findMany({
  include: {
    professor: true,
    _count: { select: { enrollments: true, assessments: true } }
  }
})

// Example from professor dashboard
const classes = await db.class.findMany({
  where: { professorId: user.id },  // Filtered by current professor
  include: { course: true, _count: true }
})

// Example from student dashboard
const enrollments = await db.enrollment.findMany({
  where: { studentId: user.id },  // Filtered by current student
  include: { class: { include: { course: true, professor: true } } }
})
```

## Notes

- All dashboards are **Server Components** by default (no "use client")
- Role checks happen in `layout.tsx` files
- Unauthorized access redirects to `/`
- Data is fetched in parallel using `Promise.all()` for performance
- Test users use placeholder `clerkId` values - you'll need to update these with real Clerk IDs for actual testing
