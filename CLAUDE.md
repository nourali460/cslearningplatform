# CLAUDE.md - CS Learning Platform Architecture Guide

**Complete System Documentation for AI-Assisted Development**

This document serves as the definitive architectural reference for the CS Learning Platform. Read this BEFORE making any changes to ensure consistency with established patterns.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Design System & UI Standards](#2-design-system--ui-standards)
3. [Database Architecture (Prisma)](#3-database-architecture-prisma)
4. [Page Architecture](#4-page-architecture)
5. [Assessment Type System](#5-assessment-type-system)
6. [Dual-Role Template System](#6-dual-role-template-system)
7. [Module Management Architecture](#7-module-management-architecture)
8. [Component Organization](#8-component-organization)
9. [API Route Patterns](#9-api-route-patterns)
10. [Key Architectural Decisions](#10-key-architectural-decisions)
11. [Development Guidelines](#11-development-guidelines)
12. [Student View Synchronization](#12-student-view-synchronization)
13. [Future Development Patterns](#13-future-development-patterns)

---

## 1. Project Overview

### Tech Stack

- **Framework:** Next.js 15+ (App Router architecture)
- **Frontend:** React 19, TypeScript 5.x (strict mode)
- **Styling:** Tailwind CSS 4.x with inline theme configuration
- **Database:** PostgreSQL via Neon (serverless)
- **ORM:** Prisma Client (NEVER use Neon adapter directly)
- **File Storage:** Google Cloud Storage (GCS)
- **Authentication:** Custom JWT-based auth with `getCurrentUser()`

### Three-Tier System Model

```
┌─────────────────────────────────────────────────────────────┐
│ ADMIN                                                        │
│ • Creates Course templates                                  │
│ • Manages ModuleTemplates, AssessmentTemplates              │
│ • Oversees users (professors, students)                     │
│ • Can access template creation pages                        │
└─────────────────┬───────────────────────────────────────────┘
                  │ Adopts Course
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ PROFESSOR                                                    │
│ • Adopts Course → Creates Class (independent copy)          │
│ • Manages Modules, Assessments for their Class              │
│ • Grades student submissions                                │
│ • Can access template creation pages (dual-role access)     │
│ • Changes DON'T sync back to Course templates               │
└─────────────────┬───────────────────────────────────────────┘
                  │ Enrolls
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ STUDENT                                                      │
│ • Enrolls in Class via class code                           │
│ • Views Class Modules (professor's version)                 │
│ • Completes assessments, sees grades                        │
│ • Progress tied to Class instance, not Course template      │
└─────────────────────────────────────────────────────────────┘
```

### Template vs Instance Model (Fork Pattern)

**Key Concept:** Courses are templates that get cloned into independent class instances.

- **Template (Course-level):** ModuleTemplate → AssessmentTemplate → ModuleItemTemplate
- **Instance (Class-level):** Module → Assessment → ModuleItem
- **Mapping:** ModuleTemplateMapping, AssessmentTemplateMapping track cloning relationships
- **No Ongoing Sync:** After adoption, Class is independent from Course
- **Course Updates:** Only affect NEW professors who adopt AFTER the update

---

## 2. Design System & UI Standards

### Color Palette (Claude.ai-inspired)

**Theme: Cream/Beige with Orange & Purple accents**

```css
/* Backgrounds */
--background: #FAFAF8           /* Main page background */
--background-secondary: #F5F5F0  /* Secondary panels */
--background-tertiary: #FFFFFF   /* Cards */

/* Text */
--foreground: #1A1A1A           /* Primary text */
--foreground-secondary: #525252  /* Secondary text */
--foreground-tertiary: #737373   /* Tertiary/muted text */

/* Borders */
--border: #E5E5E0               /* Default borders */
--border-secondary: #D4D4D4     /* Stronger borders */

/* Accent Colors */
--accent-orange: #E87C49        /* Primary action color */
--accent-purple: #8B5CF6        /* Secondary accent */

/* State Colors */
--success: #22C55E              /* Green for success/active */
--warning: #FB923C              /* Orange for warnings */
--error: #EF4444                /* Red for errors */
--info: #3B82F6                 /* Blue for informational */
```

### Typography Hierarchy

- **Font Family:** Geist Sans (body), Geist Mono (code)
- **Headings:** `font-semibold tracking-tight text-foreground`
  - h1: `text-3xl` (Dashboard titles)
  - h2: `text-2xl`
  - h3: `text-xl`
  - h4: `text-lg`
  - h5: `text-base font-semibold`
- **Body Text:** `text-base text-foreground-secondary leading-relaxed`
- **Small Text:** `text-sm` or `text-xs`

### Component Patterns

#### Compact Stat Cards (Signature Pattern)

```tsx
<div className="border-l-4 border-l-accent-purple bg-background-secondary/30 rounded-lg p-3">
  <div className="flex items-center gap-2 mb-2">
    <Icon className="h-4 w-4 text-accent-purple" />
    <span className="text-xs text-foreground-tertiary">Label</span>
  </div>
  <div className="text-2xl font-bold text-foreground">Value</div>
  <div className="text-xs text-muted-foreground mt-0.5">Subtitle</div>
</div>
```

**Key Features:**
- Border-left accent (color-coded by purpose)
- Compact padding (p-3)
- Small icons (h-4 w-4)
- Large number (text-2xl font-bold)
- Grid layout: `grid-cols-2 md:grid-cols-4 gap-3`

**Border Color Mapping:**
- `border-l-accent-purple` → Classes, Primary metrics
- `border-l-success` → Submissions, Completions
- `border-l-accent-orange` → Modules, Creative actions
- `border-l-info` → Assessments, Informational

#### Card Layout Patterns

**Grid Responsive:**
- 1 column mobile → 2 columns tablet → 3 columns desktop
- `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`

**Card Styling:**
- Background: `bg-white` or `bg-background-secondary/30`
- Border: `border border-border rounded-lg`
- Hover: `hover:shadow-sm transition-shadow`
- Padding: `p-3` (compact) or `p-4` (standard) or `p-6` (spacious)

#### Badge Variants

```tsx
<Badge variant="purple">Type</Badge>   {/* accent-purple */}
<Badge variant="info">Count</Badge>    {/* info blue */}
<Badge variant="success">Active</Badge> {/* success green */}
<Badge variant="warning">Pending</Badge> {/* warning orange */}
<Badge variant="error">Error</Badge>   {/* error red */}
<Badge variant="outline">Inactive</Badge> {/* outline only */}
```

### Spacing & Layout

- **Container Max Width:** 1280px with responsive padding
- **Grid Gaps:** `gap-3` (compact), `gap-4` (standard), `gap-6` (spacious)
- **Card Padding:** `p-3` (very compact), `p-4` (compact), `p-6` (comfortable)
- **Section Spacing:** `space-y-6` between major sections

---

## 3. Database Architecture (Prisma)

### Core Models Overview

```
Course (Template)
  ├── ModuleTemplate
  │   └── ModuleItemTemplate
  │       └── AssessmentTemplate
  └── AssessmentTemplate

Class (Instance - cloned from Course)
  ├── Module (cloned from ModuleTemplate)
  │   └── ModuleItem (cloned from ModuleItemTemplate)
  │       └── Assessment (cloned/created)
  └── Assessment

Student Progress
  ├── ModuleCompletion (per module)
  ├── ModuleItemCompletion (per module item)
  └── AssessmentSubmission (grades)

Tracking/Mapping
  ├── ModuleTemplateMapping (Module → ModuleTemplate)
  ├── ModuleItemTemplateMapping (ModuleItem → ModuleItemTemplate)
  └── AssessmentTemplateMapping (Assessment → AssessmentTemplate)
```

### Key Models & Relationships

#### User
- **Roles:** 'admin' | 'professor' | 'student'
- **isApproved:** Currently `true` by default (no approval workflow)
- **Relations:** Classes (professor), Enrollments (student), Submissions, Completions

#### Course (Template)
- **Purpose:** Admin-managed course template
- **Relations:** Classes (instances), ModuleTemplates, AssessmentTemplates
- **Fields:** code (unique), title, description, subject, level, isActive

#### Class (Instance)
- **Purpose:** Professor's adopted course
- **Tracking:** clonedFromCourseId, clonedAt, lastSyncedAt (not actively used)
- **Relations:** Course, Professor, Enrollments, Modules, Assessments
- **Unique:** classCode (e.g., "SMITH-CS101-FA25-01")

#### Module vs ModuleTemplate
- **ModuleTemplate:** Course-level structure (admin creates)
  - Relations: Course, ModuleItemTemplates
  - Fields: courseId, title, description, orderIndex, isActive, unlockAt, prerequisiteIds
- **Module:** Class-level instance (professor manages)
  - Relations: Class, ModuleItems, Completions
  - Fields: classId, title, description, orderIndex, isPublished, unlockAt, prerequisiteIds

#### ModuleItem vs ModuleItemTemplate
- **Types:** PAGE, ASSESSMENT, EXTERNAL_LINK
- **ModuleItemTemplate:** Template items (admin creates)
  - assessmentTemplateId (links to AssessmentTemplate)
- **ModuleItem:** Instance items (professor manages)
  - assessmentId (links to Assessment)
  - **Important:** onDelete: SetNull (preserves item if assessment deleted)

#### Assessment vs AssessmentTemplate
- **Types:** INTERACTIVE_LESSON, LAB, QUIZ, EXAM, DISCUSSION
- **Submission Types:** TEXT, FILE, BOTH, NONE
- **AssessmentTemplate:** Course-level defaults (admin creates)
- **Assessment:** Class-level instances (professor creates/clones)
- **Discussion Fields:** allowPeerReplies, minimumReplyCount, autoCompleteEnabled, etc.

#### Student Progress Tracking
- **ModuleCompletion:** Tracks when student completes entire module
  - **CASCADE DELETE:** Deleted if module deleted (current behavior)
- **ModuleItemCompletion:** Tracks individual item completions
  - **CASCADE DELETE:** Deleted if module item deleted (current behavior)
- **AssessmentSubmission:** Stores grades and submissions
  - Status: DRAFT, SUBMITTED, GRADED, RETURNED, LATE
  - **Preserved:** Not deleted when assessment removed from module

### Template vs Instance Fork Pattern (Dual Creation Paths)

**Three-Tier Assessment Flow:**

```
Admin Path (Course-level Templates):
  Admin Creates → AssessmentTemplate (for courseId)
       ↓
  Professor Adopts Course → Clones AssessmentTemplate → Assessment (class-level)

Professor Direct Path (Class-level Assessments):
  Professor Creates → Assessment (for classId) directly
       ↓
  Both paths lead to same result: Class-level Assessment
       ↓
  Student Submits → AssessmentSubmission (grading)
```

**Key Insights:**
- **Admin templates** are course-level defaults that get cloned during course adoption
- **Professor template pages** (`/admin/templates/*`) create class-level Assessments directly
- Professor has autonomy to create custom assessments without using admin templates
- Both creation methods result in independent class-level Assessment records
- Student always interacts with class-level Assessments, never templates

### Important Cascades & Constraints

```prisma
// Module deleted → All ModuleCompletions deleted (CASCADE)
ModuleCompletion: onDelete: Cascade

// ModuleItem deleted → All ModuleItemCompletions deleted (CASCADE)
ModuleItemCompletion: onDelete: Cascade

// Assessment deleted → ModuleItem.assessmentId set to NULL (SetNull)
ModuleItem.assessment: onDelete: SetNull

// AssessmentSubmission → Preserved when assessment deleted
```

### Prisma Best Practices

1. **Always use PrismaClient:**
   ```typescript
   import { db } from '@/lib/db'
   ```
   NEVER use Neon adapter or direct database drivers.

2. **Regenerate Prisma Client after schema changes:**
   ```bash
   npx prisma generate
   ```

3. **Use transactions for multi-model updates:**
   ```typescript
   await db.$transaction([...])
   ```

4. **Decimal type conversion for display:**
   ```typescript
   Number(assessment.maxPoints).toFixed(2)
   ```

---

## 4. Page Architecture

**Total: 32 Pages (including dual-role template pages)**

### Root Pages (3)

```
/                    Landing page with role-based redirect
/sign-in             Unified sign-in for all roles (admin, professor, student)
/sign-up             Registration page (auto-approve professors)
```

### Admin Pages (11)

```
/admin                              Entry point, redirects to overview
/admin/overview                     Dashboard with platform statistics
/admin/courses                      Course list (card grid)
/admin/courses/[courseId]           Course detail page with tabs:
                                    ├─ Overview (course info, active classes)
                                    ├─ Modules (ModuleTemplate management)
                                    ├─ Assessment Templates
                                    └─ Settings
/admin/people                       User management (no approval needed)
/admin/templates/discussion         💬 Discussion template creation (DUAL-ROLE)
/admin/templates/page              📄 Page template creation (DUAL-ROLE)
/admin/templates/lab               🧪 Lab template creation (DUAL-ROLE)
/admin/templates/quiz              ❓ Quiz template creation (DUAL-ROLE)
/admin/templates/exam              📝 Exam template creation (DUAL-ROLE)
/admin/templates/lesson            📖 Lesson template creation (DUAL-ROLE)
```

**Admin Navigation:**
- Overview
- Courses & Classes
- People
- 💬 Discussion Templates
- 🧪 Lab Templates
- ❓ Quiz Templates
- 📝 Exam Templates
- 📖 Lesson Templates
- 📄 Page Templates

**Note on Template Pages:** These 6 template pages are **DUAL-ROLE** - accessible by both admin AND professor. See Section 6 for details.

### Professor Pages (7)

```
/professor                          Dashboard with class statistics
/professor/courses                  Browse & adopt available courses
/professor/assessments              View/manage all class assessments
/professor/assessments/[assessmentId]/discussions  Grade discussion posts
/professor/grading                  Grading interface (submissions grid)
/professor/modules                  Manage class modules
/professor/students                 Manage students in classes
```

**Professor Navigation:**
- Dashboard
- Available Courses
- Students
- Modules
- Assessments
- Create Discussion (→ `/admin/templates/discussion`)
- Create Page (→ `/admin/templates/page`)
- Create Lab (→ `/admin/templates/lab`)
- Create Quiz (→ `/admin/templates/quiz`)
- Create Exam (→ `/admin/templates/exam`)
- Create Lesson (→ `/admin/templates/lesson`)
- Grading

**Note:** Professor navigation includes links to `/admin/templates/*` pages (dual-role access).

### Student Pages (11)

```
/student                            Dashboard with class overview, upcoming assessments
/student/classes                    All enrolled classes list
/student/classes/[classId]/modules  View modules for specific class
/student/enroll                     Enroll in class via code
/student/assignments                All assignments across all classes
/student/assignments/[assessmentId]                Assignment detail/overview
/student/assignments/[assessmentId]/submit         Submit LAB
/student/assignments/[assessmentId]/take           Take QUIZ/EXAM
/student/assignments/[assessmentId]/lesson         Interactive LESSON
/student/assignments/[assessmentId]/discussion     Participate in DISCUSSION
/student/grades                     View all grades across classes
```

**Student Navigation:**
- Dashboard
- Classes
- Assignments
- Grades

### Layout Hierarchy & Authentication

#### Admin Layout (`/app/admin/layout.tsx`)

**Conditional Authentication & Sidebar:**
```typescript
// Path-based conditional auth
const isTemplateRoute = pathname?.startsWith('/admin/templates')

if (isTemplateRoute) {
  checkDualRole()  // Allow admin OR professor
} else {
  checkAdminOnly()  // Enforce admin-only
}

// Conditional sidebar rendering
const isProfessor = user.role === 'professor'
const sidebarNavItems = isProfessor ? professorNavItems : adminNavItems
const sidebarTitle = isProfessor ? 'Professor Portal' : 'Admin Panel'
```

**Why This Matters:**
- Professor accessing `/admin/templates/page` sees "Professor Portal" sidebar
- Professor accessing `/admin/overview` gets redirected to sign-in (admin-only)
- Admin sees "Admin Panel" sidebar on all admin routes
- Prevents confusion about which role user is operating in

#### Template Layout (`/app/admin/templates/layout.tsx`)

**Dual-Role Authentication Check:**
```typescript
// Try admin first
const adminRes = await fetch('/api/admin/whoami')
if (adminRes.ok) {
  setIsAuthenticated(true)
  return
}

// Try professor second
const profRes = await fetch('/api/professor/profile')
if (profRes.ok) {
  setIsAuthenticated(true)
  return
}

// Both failed (401/403) - redirect to sign-in
if (isNotAdmin && isNotProfessor) {
  router.push('/sign-in')
}
```

**Purpose:** Overrides parent admin layout to allow both roles. Returns `<>{children}</>` without additional wrapper since parent layout provides sidebar.

#### Professor Layout (`/app/professor/layout.tsx`)

**Standard Professor Authentication:**
- Checks `/api/professor/profile`
- Uses shared `professorNavItems` from `/lib/navigation.ts`
- Shows "Professor Portal" title

### Pages to DELETE (Redundant)

**Will be removed during cleanup:**
- ❌ `/app/admin/categories/page.tsx` - Categories removed from architecture
- ❌ `/app/admin/modules/page.tsx` - Now in course detail tabs
- ❌ `/app/admin/assessments/page.tsx` - Now in course detail tabs
- ❌ `/app/admin/courses/[courseId]/templates/page.tsx` - Redundant with tabs
- ❌ `/app/admin/editor-lab/page.tsx` - Testing page
- ❌ `/app/admin-login/page.tsx` - Use unified sign-in
- ❌ `/app/dashboard/page.tsx` - Replace with role redirects
- ❌ `/app/professor/pending-approval/page.tsx` - No approval system

**RULE:** No new pages should be created without architectural justification documented in this file.

---

## 5. Assessment Type System

### Five Assessment Types

```typescript
enum AssessmentType {
  INTERACTIVE_LESSON  // Rich content with embedded exercises
  LAB                 // Coding assignments with file submissions
  QUIZ                // Time-limited multiple choice/short answer
  EXAM                // High-stakes assessments
  DISCUSSION          // Threaded discussion boards
}
```

### Implementation Status

| Type | Selection UI | Routing | Student Page | Functionality | Status |
|------|-------------|---------|--------------|---------------|--------|
| DISCUSSION | ✅ | ✅ | ✅ | ✅ | **Fully Implemented** |
| LAB | ✅ | ✅ | ✅ | 🚧 | Page ready, needs implementation |
| QUIZ | ✅ | ✅ | ✅ | 🚧 | Page ready, needs implementation |
| EXAM | ✅ | ✅ | ✅ | 🚧 | Page ready, needs implementation |
| INTERACTIVE_LESSON | ✅ | ✅ | ✅ | 🚧 | Page ready, needs implementation |

### Assessment Routing Pattern

**Student Detail Page:** `/student/assignments/[assessmentId]/page.tsx`

```typescript
// Routing logic based on type
switch (assessment.type) {
  case 'DISCUSSION':
    router.push(`/student/assignments/${assessmentId}/discussion`)
    break
  case 'QUIZ':
  case 'EXAM':
    router.push(`/student/assignments/${assessmentId}/take`)
    break
  case 'LAB':
    router.push(`/student/assignments/${assessmentId}/submit`)
    break
  case 'INTERACTIVE_LESSON':
    router.push(`/student/assignments/${assessmentId}/lesson`)
    break
}
```

### Type Selection UI

**Admin (QuickAssessmentTemplateForm):**
```tsx
<Select value={formData.type} onValueChange={...}>
  <SelectItem value="INTERACTIVE_LESSON">📖 Interactive Lesson</SelectItem>
  <SelectItem value="LAB">🧪 Lab</SelectItem>
  <SelectItem value="EXAM">📝 Exam</SelectItem>
  <SelectItem value="QUIZ">❓ Quiz</SelectItem>
  <SelectItem value="DISCUSSION">💬 Discussion</SelectItem>
</Select>
```

**Professor (CreateAssessmentModal):** Same UI, same options.

**Professor (Template Pages):** Same UI via `/admin/templates/{type}` pages.

### Reference Implementation: DISCUSSION

**Complete workflow:**
1. **Create:** Professor selects DISCUSSION type, sets prompts, requirements
2. **Student View:** Rich text prompt display, post editor, threaded replies
3. **Grading:** Professor grades each post individually, provides feedback
4. **Completion:** Auto-completion based on post + reply requirements (optional)

**Files:**
- Student: `/app/student/assignments/[id]/discussion/page.tsx`
- Professor: `/app/professor/assessments/[id]/discussions/page.tsx`
- Components: `DiscussionPostForm`, `StudentDiscussionPost`, `ProfessorDiscussionReply`

---

## 6. Dual-Role Template System

**KEY ARCHITECTURAL FEATURE:** Both admin and professor can access the same template creation pages at `/admin/templates/*`, but they create different types of database records.

### Concept

**Admin Mode:**
- Creates **AssessmentTemplate** records (course-level)
- Selects `courseId` via Course Selector
- Templates are stored for course adoption
- API: `POST /api/admin/templates`
- Field: `isActive` (controls if template is cloned during adoption)

**Professor Mode:**
- Creates **Assessment** records (class-level)
- Selects `classId` via ClassSelector component
- Assessments are immediately available to students
- API: `POST /api/professor/assessments`
- Field: `isPublished` (controls student visibility)

**Both use identical UI and routes, but different logic based on detected role.**

### Template Pages (All Dual-Role)

```
/admin/templates/discussion    💬 Discussion creation
/admin/templates/page          📄 Page creation
/admin/templates/lab           🧪 Lab creation
/admin/templates/quiz          ❓ Quiz creation
/admin/templates/exam          📝 Exam creation
/admin/templates/lesson        📖 Interactive Lesson creation
```

### Implementation Pattern

**Every template page follows this structure:**

```typescript
// Role detection
const [userRole, setUserRole] = useState<'admin' | 'professor'>('admin')

const detectRole = async () => {
  // Try admin first
  const adminRes = await fetch('/api/admin/whoami')
  if (adminRes.ok) {
    setUserRole('admin')
    return
  }

  // Try professor second
  const profRes = await fetch('/api/professor/profile')
  if (profRes.ok) {
    setUserRole('professor')
    return
  }

  // Both failed - redirect
  const isNotAdmin = adminRes.status === 401 || adminRes.status === 403
  const isNotProfessor = profRes.status === 401 || profRes.status === 403

  if (isNotAdmin && isNotProfessor) {
    router.push('/sign-in')
  }
}

// Form state with unified scopeId
const [formData, setFormData] = useState({
  scopeId: '', // courseId (admin) or classId (professor)
  title: '',
  description: '',
  maxPoints: '100',
  submissionType: 'ONLINE',
  // ... type-specific fields
})

// Conditional scope selector
{userRole === 'admin' ? (
  <CourseSelector
    value={formData.scopeId}
    onValueChange={(id) => setFormData({...formData, scopeId: id})}
  />
) : (
  <ClassSelector
    value={formData.scopeId}
    onValueChange={(id) => setFormData({...formData, scopeId: id})}
  />
)}

// Conditional API call
const url = userRole === 'admin'
  ? `/api/admin/templates`
  : `/api/professor/assessments`

const body = userRole === 'admin'
  ? { courseId: formData.scopeId, ...formData, isActive: true }
  : { classId: formData.scopeId, ...formData, isPublished: false }
```

### Key Components

#### ClassSelector (`/components/shared/ClassSelector.tsx`)

**Purpose:** Allows professor to select which class to create assessment for.

**Props:**
```typescript
interface ClassSelectorProps {
  value: string           // classId
  onValueChange: (classId: string) => void
  required?: boolean
  label?: string         // Default: 'Class'
  placeholder?: string   // Default: 'Select a class'
}
```

**Features:**
- Fetches professor's classes from `/api/professor/classes`
- Elegant two-line display format:
  ```
  CS101 - Introduction to Computer Science
  Section 1 • Fall 2024
  ```
- Loading state with spinner
- Error state with retry button
- Empty state message if no classes created

**Data Transformation:**
```typescript
const classes = data.classes.map((cls: any) => ({
  id: cls.id,
  courseCode: cls.course.code,
  courseTitle: cls.course.title,
  sectionNumber: cls.section,
  semester: cls.term,
  year: cls.year,
}))
```

### Navigation Integration

**Shared Navigation File:** `/lib/navigation.ts`

```typescript
export const professorNavItems = [
  { href: '/professor', label: 'Dashboard', icon: BookOpen },
  { href: '/professor/courses', label: 'Available Courses', icon: Library },
  { href: '/professor/students', label: 'Students', icon: GraduationCap },
  { href: '/professor/modules', label: 'Modules', icon: Layers },
  { href: '/professor/assessments', label: 'Assessments', icon: ClipboardList },
  { href: '/admin/templates/discussion', label: 'Create Discussion', icon: MessageSquare },
  { href: '/admin/templates/page', label: 'Create Page', icon: FileText },
  { href: '/admin/templates/lab', label: 'Create Lab', icon: FlaskConical },
  { href: '/admin/templates/quiz', label: 'Create Quiz', icon: HelpCircle },
  { href: '/admin/templates/exam', label: 'Create Exam', icon: FileText },
  { href: '/admin/templates/lesson', label: 'Create Lesson', icon: BookOpenCheck },
  { href: '/professor/grading', label: 'Grading', icon: CheckSquare },
]
```

**Used By:**
- `/app/professor/layout.tsx` - Always uses professorNavItems
- `/app/admin/layout.tsx` - Uses professorNavItems when `user.role === 'professor'`

### User Experience Flow

**Professor Journey:**
1. Professor logs in → sees "Professor Portal" sidebar
2. Clicks "Create Discussion" → navigates to `/admin/templates/discussion`
3. Admin layout detects template route → runs dual-role auth check
4. Detects professor role → shows "Professor Portal" sidebar (not "Admin Panel")
5. Template page detects professor role → shows ClassSelector
6. Professor selects class, creates assessment
7. Assessment created via `/api/professor/assessments` (class-level)
8. Professor can navigate back to "Dashboard" (no sign-out confusion)

**Admin Journey:**
1. Admin logs in → sees "Admin Panel" sidebar
2. Clicks "💬 Discussion Templates" → navigates to `/admin/templates/discussion`
3. Admin layout detects admin role → shows "Admin Panel" sidebar
4. Template page detects admin role → shows Course Selector
5. Admin selects course, creates template
6. Template created via `/api/admin/templates` (course-level)
7. Admin can navigate to other admin pages normally

### Why This Architecture?

**Benefits:**
1. **DRY Principle:** Single UI codebase for template creation
2. **Professor Autonomy:** Professors can create custom assessments without admin templates
3. **No Role Confusion:** Sidebar stays consistent with user's actual role
4. **Flexible Workflows:** Both top-down (admin templates) and bottom-up (professor direct) creation
5. **Natural Navigation:** Professors access templates as part of their workflow

**Trade-offs:**
- URL structure puts professor routes under `/admin/*` path (acceptable due to shared logic)
- Requires careful conditional auth in admin layout
- Template pages must handle both roles (added complexity)

---

## 7. Module Management Architecture

### Core Concepts

**Modules** are Canvas-style containers that organize course content in a structured, sequential manner.

**Module Hierarchy:**
```
Module
  ├─ ModuleItem (PAGE) - Rich content pages
  ├─ ModuleItem (ASSESSMENT) - Links to assessment
  └─ ModuleItem (EXTERNAL_LINK) - External resources
```

### Admin vs Professor Module Management

#### Admin (Course-level Templates)

**Scope:** Manages `ModuleTemplate` for `Course`

**Location:** `/admin/courses/[courseId]` → Modules tab

**Features:**
- Create/edit/delete ModuleTemplates
- Add ModuleItemTemplates (PAGE, ASSESSMENT, EXTERNAL_LINK)
- Link to AssessmentTemplates
- Set orderIndex (will add drag-and-drop)
- Set isActive (cloned when true)

**Component:** `CourseModuleManager`
- Wraps `ModuleAccordion` with course-specific logic
- Manages modals for create/edit operations
- Calls `/api/admin/module-templates/*` endpoints

#### Professor (Class-level Instances)

**Scope:** Manages `Module` for `Class`

**Location:** `/professor/modules`

**Features:**
- Create/edit/delete Modules (independent from templates after adoption)
- Add ModuleItems (PAGE, ASSESSMENT, EXTERNAL_LINK)
- Link to Assessments (can create assessments inline)
- Reorder modules
- Reorder items within modules (drag-and-drop coming)
- Set unlock dates, prerequisites
- Publish/unpublish modules and items

**Component:** Uses `ModuleAccordion` directly

**API:** `/api/professor/classes/[classId]/modules/*`

### Shared Component: ModuleAccordion

**Location:** `/components/modules/ModuleAccordion.tsx`

**Props:**
```typescript
interface ModuleAccordionProps {
  modules: Module[] | ModuleTemplate[]
  onEditModule?: (module) => void
  onDeleteModule?: (moduleId, title) => void
  onAddItem?: (module) => void
  onEditItem?: (module, item) => void
  onDeleteItem?: (moduleId, itemId) => void
  role?: 'student' | 'professor' | 'admin'
  showCompletion?: boolean
}
```

**Features:**
- Collapsible accordion UI
- Edit/delete dropdown actions
- Add item button
- Displays all module items
- Shows completion badges (student view)
- Draft/Published badges
- Unlock date indicators

### Module Item Types

#### PAGE
- **Purpose:** Content pages (instructions, readings)
- **Field:** `pageContent` (markdown or HTML)
- **Display:** Rendered in modal or inline

#### ASSESSMENT
- **Purpose:** Links to an Assessment
- **Field:** `assessmentId`
- **Link Behavior:** Navigates to assessment detail page
- **Override:** `customDescription` overrides assessment description

#### EXTERNAL_LINK
- **Purpose:** Links to external resources (YouTube, Revel, etc.)
- **Field:** `externalUrl`
- **Display:** Opens in new tab

### Drag-and-Drop Reordering (Planned)

**Library:** @dnd-kit/core, @dnd-kit/sortable

**Implementation:**
1. Wrap module items in sortable context
2. Add drag handles (⋮⋮ icon)
3. On drag end, call reorder API
4. Update orderIndex for all items in transaction

**APIs:**
- Admin: `/api/admin/module-templates/[id]/items/reorder` (exists)
- Professor: `/api/professor/classes/[classId]/modules/[moduleId]/items/reorder` (exists)

---

## 8. Component Organization

### Directory Structure

```
components/
├── admin/                    # Admin-only components
│   ├── CourseModuleManager.tsx
│   ├── SimpleCourseCreateModal.tsx
│   ├── QuickAssessmentTemplateForm.tsx
│   ├── QuickModuleForm.tsx
│   ├── CourseDetailActions.tsx
│   ├── CoursesPageActions.tsx
│   ├── ModuleTemplateForm.tsx
│   ├── ModuleItemTemplateForm.tsx
│   ├── AdminFilterBar.tsx
│   └── PasswordManager.tsx
│
├── professor/                # Professor-only components
│   ├── CreateAssessmentModal.tsx
│   ├── CreateClassModal.tsx
│   ├── ModuleForm.tsx
│   ├── ModuleItemForm.tsx
│   ├── ModuleCard.tsx
│   ├── GradeCell.tsx
│   ├── IndividualGradingModal.tsx
│   ├── GradebookModal.tsx
│   ├── DiscussionGradingPanel.tsx
│   ├── DiscussionPostCard.tsx
│   ├── ProfessorDiscussionReply.tsx
│   └── CreateStudentModal.tsx
│
├── student/                  # Student-only components
│   ├── AssessmentCard.tsx
│   ├── AssessmentTypeIcon.tsx
│   ├── DiscussionPostForm.tsx
│   ├── StudentDiscussionPost.tsx
│   ├── StudentModuleCard.tsx
│   ├── ModuleAssignmentsView.tsx
│   └── PageContentModal.tsx
│
├── modules/                  # Shared module components
│   ├── ModuleAccordion.tsx   # Main module display component
│   ├── ModuleItemRow.tsx     # Individual item display
│   ├── ModuleCompletionBadge.tsx
│   └── (future) DraggableModuleItems.tsx
│
├── navigation/               # Navigation components
│   └── Sidebar.tsx           # Shared sidebar component
│
├── shared/                   # Shared utility components
│   ├── ClassSelector.tsx     # Professor class selection
│   └── (future) CourseSelector.tsx
│
├── ui/                       # shadcn/ui primitives
│   ├── accordion.tsx
│   ├── badge.tsx
│   ├── button.tsx
│   ├── card.tsx
│   ├── checkbox.tsx
│   ├── dialog.tsx
│   ├── dropdown-menu.tsx
│   ├── input.tsx
│   ├── select.tsx
│   ├── table.tsx
│   ├── tabs.tsx
│   ├── textarea.tsx
│   ├── safe-html.tsx
│   └── back-button.tsx
│
├── ClassCodeCopy.tsx         # Shared utility
├── FileAttachmentInput.tsx   # File upload
└── logout-button.tsx         # Auth
```

### Component Naming Conventions

- **Modal suffix:** Components that open in dialog/modal (e.g., `CreateAssessmentModal`)
- **Form suffix:** Form components (e.g., `ModuleTemplateForm`)
- **Card suffix:** Card display components (e.g., `StudentModuleCard`)
- **Row suffix:** List item components (e.g., `ModuleItemRow`)
- **Actions suffix:** Button/action containers (e.g., `CourseDetailActions`)
- **Selector suffix:** Dropdown selection components (e.g., `ClassSelector`)

### Shared vs Role-Specific

**Use `/components/modules/*` when:**
- Component is used by both admin and professor (e.g., `ModuleAccordion`)
- Component displays data in the same way for both roles
- Component is read-only for students

**Use `/components/shared/*` when:**
- Component is used across multiple roles
- Component is a utility (ClassSelector, CourseSelector)
- Component is not module-specific

**Use role-specific folders when:**
- Component has role-specific logic
- Component is only accessible to one role
- Component has different UI for different roles

---

## 9. API Route Patterns

### Admin Routes

**Pattern:** `/api/admin/{resource}`

```
/api/admin/courses
  GET    - List all courses
  POST   - Create course

/api/admin/courses/[id]
  GET    - Get course details
  PUT    - Update course
  DELETE - Delete course

/api/admin/module-templates
  GET    - List templates (filter by courseId)
  POST   - Create module template

/api/admin/module-templates/[id]
  PUT    - Update module template
  DELETE - Delete module template

/api/admin/module-templates/[id]/items
  POST   - Create module item template

/api/admin/module-templates/[id]/items/[itemId]
  PUT    - Update module item template
  DELETE - Delete module item template

/api/admin/module-templates/[id]/items/reorder
  POST   - Reorder module items (array of {id, orderIndex})

/api/admin/templates
  GET    - List assessment templates (filter by courseId)
  POST   - Create assessment template

/api/admin/whoami
  GET    - Get current admin user (auth check)
```

### Professor Routes

**Pattern:** `/api/professor/{resource}` or `/api/professor/classes/[classId]/{resource}`

```
/api/professor/profile
  GET    - Get professor profile (auth check)

/api/professor/classes
  GET    - List professor's classes
  POST   - Create class (adopt course)

/api/professor/classes/[classId]/assessments
  GET    - List class assessments
  POST   - Create assessment

/api/professor/classes/[classId]/assessments/from-template
  POST   - Clone assessment from template

/api/professor/classes/[classId]/modules
  GET    - List class modules
  POST   - Create module

/api/professor/classes/[classId]/modules/reorder
  POST   - Reorder modules

/api/professor/classes/[classId]/modules/[moduleId]
  PUT    - Update module
  DELETE - Delete module

/api/professor/classes/[classId]/modules/[moduleId]/items
  POST   - Create module item

/api/professor/classes/[classId]/modules/[moduleId]/items/[itemId]
  PUT    - Update module item
  DELETE - Delete module item

/api/professor/classes/[classId]/modules/[moduleId]/items/reorder
  POST   - Reorder module items

/api/professor/classes/[classId]/gradebook
  GET    - Get all grades for class

/api/professor/classes/[classId]/submissions
  GET    - Get all submissions for class

/api/professor/assessments
  POST   - Create assessment (used by template pages)

/api/professor/assessments/[assessmentId]/students/[studentId]/grade
  POST   - Grade individual submission

/api/professor/discussions/[discussionId]/posts
  GET    - Get all posts for discussion

/api/professor/discussions/posts/[postId]/grade
  POST   - Grade discussion post
```

### Student Routes

**Pattern:** `/api/student/{resource}`

```
/api/student/classes
  GET    - List enrolled classes

/api/student/classes/[classId]/modules
  GET    - List modules for class (filtered: published only)

/api/student/enrollments/join
  POST   - Enroll via class code

/api/student/assignments
  GET    - List all assignments (across classes, with filters)

/api/student/assessments/[assessmentId]
  GET    - Get assessment details

/api/student/assessments/[assessmentId]/submit
  POST   - Submit assessment

/api/student/grades
  GET    - Get all grades

/api/student/module-items/[itemId]/complete
  POST   - Mark module item as complete

/api/student/discussions/[assessmentId]/posts
  GET    - Get discussion posts
  POST   - Create new post

/api/student/discussions/posts/[postId]/replies
  POST   - Reply to discussion post
```

### Dual-Role Authentication Pattern

**Client-Side Role Detection:**

```typescript
// Used in template pages and dual-role layouts
const detectRole = async () => {
  let adminStatus = 0
  let profStatus = 0

  // Try admin first
  try {
    const adminRes = await fetch('/api/admin/whoami')
    adminStatus = adminRes.status
    if (adminRes.ok) {
      const data = await adminRes.json()
      setUserRole('admin')
      setUser(data.user)
      return
    }
  } catch (error) {
    console.error('Error checking admin role:', error)
  }

  // Try professor second
  try {
    const profRes = await fetch('/api/professor/profile')
    profStatus = profRes.status
    if (profRes.ok) {
      const data = await profRes.json()
      setUserRole('professor')
      setUser(data.professor)
      return
    }
  } catch (error) {
    console.error('Error checking professor role:', error)
  }

  // Both failed - redirect if both returned 401/403
  const isNotAdmin = adminStatus === 401 || adminStatus === 403
  const isNotProfessor = profStatus === 401 || profStatus === 403

  if (isNotAdmin && isNotProfessor) {
    router.push('/sign-in')
  }
}
```

**Status Code Semantics:**
- **401 Unauthorized:** No valid session/token for this role
- **403 Forbidden:** Authenticated but wrong role (e.g., student trying admin endpoint)
- Both treated as "not this role" in dual-role detection

**Why This Pattern:**
- Allows same route to serve different roles
- Frontend determines which API to call based on detected role
- Prevents false sign-outs from 403 responses
- Enables professor access to template pages

### API Authentication Helpers

**Server-Side Role Enforcement:**

```typescript
import { requireAdmin, requireProfessor, requireStudent, handleAuthError } from '@/lib/auth'

// Pattern 1: Single-role endpoint
export async function POST(request: Request) {
  try {
    const user = await requireProfessor()  // Throws if not professor
    // ... handle request
    return NextResponse.json({ success: true })
  } catch (error) {
    return handleAuthError(error)  // Returns 401 or 403
  }
}

// Pattern 2: Manual dual-role check (rarely needed)
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()

    if (user.role === 'admin') {
      // Admin logic
      return NextResponse.json({ adminData })
    } else if (user.role === 'professor') {
      // Professor logic
      return NextResponse.json({ professorData })
    } else {
      throw new Error('Forbidden: Insufficient permissions')
    }
  } catch (error) {
    return handleAuthError(error)
  }
}
```

**Helper Functions:**
- `requireAdmin()` - Returns admin user or throws (401/403)
- `requireProfessor()` - Returns professor user or throws (401/403)
- `requireStudent()` - Returns student user or throws (401/403)
- `handleAuthError(error)` - Translates errors to HTTP responses

**Error Handling:**
```typescript
// handleAuthError translates:
"Unauthorized" → 401 JSON response
"Forbidden: Insufficient permissions" → 403 JSON response
Other errors → 500 JSON response
```

### Standard API Response Patterns

**Success:**
```typescript
return NextResponse.json({
  success: true,
  data: result,
  message: 'Optional success message'
})
```

**Error:**
```typescript
return NextResponse.json(
  { error: 'Human-readable error message' },
  { status: 400 | 401 | 403 | 404 | 500 }
)
```

**Validation Error:**
```typescript
if (!body.title) {
  return NextResponse.json(
    { error: 'Title is required' },
    { status: 400 }
  )
}
```

---

## 10. Key Architectural Decisions

### 1. No Professor Approval System

**Decision:** Auto-approve professors on signup.

**Rationale:**
- Reduces friction for course adoption
- Admin can manage professors via People page if needed
- Simplifies onboarding flow

**Removed:**
- `isApproved` checks in registration
- Pending approval page
- Approval API endpoints

### 2. Template vs Instance (Fork Model)

**Decision:** Courses are templates that get cloned into independent class instances.

**Implications:**
- Course updates DON'T affect existing classes
- Course updates DO affect NEW adoptions
- Professors have full control over their class after adoption
- No ongoing sync between template and instance

**Why:**
- Prevents disruption of active classes
- Allows professor customization
- Clear ownership boundaries

### 3. No Ongoing Sync

**Decision:** After adoption, classes are independent from course templates.

**Rationale:**
- Professors need autonomy
- Student progress shouldn't be affected by admin changes
- Simpler mental model
- Less risk of data conflicts

**Future consideration:** Optional "sync updates" feature if requested.

### 4. Student Progress Preservation

**Current Behavior:** ModuleCompletion and ModuleItemCompletion CASCADE DELETE when module/item deleted.

**Design Intent:**
- Grades (AssessmentSubmission) are always preserved
- Module structure changes visible on page refresh
- Completion records tied to specific module/item instances

**Trade-off:** Deleting a module removes student completion history for that module.

### 5. Auto-Refresh, No Real-Time

**Decision:** Students see changes on page refresh, not live updates.

**Implementation:**
- All student pages use fresh database queries
- No WebSockets or Server-Sent Events
- No client-side data caching (except UI state)

**Rationale:**
- Simpler implementation
- Sufficient for educational use case
- Reduces infrastructure complexity

**User Experience:**
- Professor modifies module → Student refreshes page → Sees change
- No "Refresh" button needed, navigation triggers fetch

### 6. Drag-and-Drop for Reordering

**Decision:** Use drag-and-drop UI, not manual orderIndex input.

**Library:** @dnd-kit

**Rationale:**
- Better UX for reordering
- Visual feedback
- Prevents index conflicts
- Industry standard (Canvas, Blackboard use drag-and-drop)

**Implementation:**
- Backend calculates orderIndex automatically
- Frontend sends new order array to reorder endpoint
- Optimistic UI updates

### 7. No Categories System

**Decision:** Removed categories entirely from architecture.

**Rationale:**
- Not essential for MVP
- Adds complexity without clear value
- Courses can use subject/level fields for filtering

### 8. Unified Sign-In

**Decision:** One sign-in page for all roles, no separate admin login.

**Rationale:**
- Simpler for users
- Role determined by JWT token
- Redirect after login based on role

### 9. Dual-Role Template Access

**Decision:** Both admin and professor can access `/admin/templates/*` pages.

**Rationale:**
- Professors need quick way to create assessments
- Reuses admin template UI/logic (DRY)
- Maintains professor autonomy (creates class-level assessments)
- Reduces code duplication

**Implementation:**
- Path-based conditional auth in admin layout
- Role detection in template pages
- Conditional sidebar rendering
- Different API endpoints based on role

**Benefits:**
- Single codebase for template creation
- Natural workflow for professors
- No role confusion (sidebar shows correct role)
- Flexible creation paths (top-down and bottom-up)

---

## 11. Development Guidelines

### Before Starting Any Feature

1. **Read this document** to understand established patterns
2. **Check existing components** before creating new ones
3. **Follow page structure** - don't create random new pages
4. **Verify authentication** is properly implemented
5. **Test student view** to ensure changes propagate correctly
6. **Understand dual-role access** for template pages

### Role Permission Boundaries

**Student:**
- Can only access: `/student/**` routes
- Can only fetch: Own enrollments, classes, assignments, grades
- API: All require student role (401 if not student)
- No modification capabilities (read-only except submissions)

**Professor:**
- Can access: `/professor/**` routes AND `/admin/templates/**` routes
- Can create/modify: Classes, Modules, Assessments, Grades
- Can view: Students in their classes, submissions
- Cannot access: `/admin/overview`, `/admin/courses`, `/admin/people`
- API: `/api/professor/**` routes require professor role

**Admin:**
- Can access: `/admin/**` routes (all pages)
- Can create/modify: Courses, AssessmentTemplates, ModuleTemplates, Users
- Can view: All classes, all enrollments, all submissions
- API: `/api/admin/**` routes require admin role

**Important Asymmetry:**
- Template creation (`/admin/templates/*`) is **DUAL-ROLE**
- Course management (`/admin/courses`, `/admin/overview`, `/admin/people`) is **ADMIN-ONLY**
- Professor CAN'T see other professors' classes or students

### Prisma Workflow

```bash
# After schema changes
npx prisma generate       # Regenerate Prisma Client
npx prisma db push        # Push changes to database (dev)
npx prisma migrate dev    # Create migration (production-ready)
```

**CRITICAL:** Always regenerate Prisma Client after schema changes. Forgetting this causes "model not found" errors.

### Component Creation Checklist

**Before creating a new component:**
- [ ] Check if similar component exists in `/components/ui/*`
- [ ] Check if role-specific component exists
- [ ] Check if shared module component exists
- [ ] Can existing component be extended with props?
- [ ] Does it belong in `/components/shared/*`?

**New component requirements:**
- [ ] TypeScript interfaces defined
- [ ] Proper error handling
- [ ] Loading states (if async)
- [ ] Accessibility (ARIA labels, keyboard nav)
- [ ] Responsive design (mobile-first)

### API Route Checklist

**Every API route must have:**
- [ ] Authentication check (`getCurrentUser()` or `requireRole()`)
- [ ] Role verification
- [ ] Input validation
- [ ] Error handling with meaningful messages
- [ ] Proper HTTP status codes (401, 403, 400, 404, 500)
- [ ] Database error handling
- [ ] Transaction for multi-model updates

**Example:**
```typescript
export async function POST(request: Request) {
  try {
    const user = await requireProfessor()

    const body = await request.json()
    // Validate input
    if (!body.title) {
      return NextResponse.json({ error: 'Title required' }, { status: 400 })
    }

    // Database operation
    const result = await db.model.create({ data: body })

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('API Error:', error)
    return handleAuthError(error)
  }
}
```

### Styling Guidelines

**DO:**
- Use Tailwind utility classes
- Follow established color palette
- Use semantic color names (accent-purple, success, etc.)
- Keep spacing consistent (gap-3, gap-4, gap-6)
- Use responsive breakpoints (sm:, md:, lg:)

**DON'T:**
- Use arbitrary values unless absolutely necessary
- Add custom CSS in globals.css for one-off styles
- Use inline styles
- Mix RGB/Hex with CSS custom properties
- Override component library defaults globally

### Git Commit Guidelines

**Format:**
```
<type>: <short description>

<optional detailed description>
```

**Types:**
- feat: New feature
- fix: Bug fix
- refactor: Code restructuring
- docs: Documentation only
- style: Formatting, styling
- test: Adding tests
- chore: Maintenance tasks

**Example:**
```
feat: Add dual-role template system for professors

- Create shared navigation file with professorNavItems
- Update admin layout with conditional sidebar rendering
- Update all 6 template pages with role detection
- Add ClassSelector component for professor class selection
```

### Error Handling Strategy

**Frontend:**
- Display user-friendly error messages
- Log detailed errors to console (development)
- Show loading states during async operations
- Provide retry mechanisms for failed operations

**Backend:**
- Log full error stack traces
- Return generic error messages to client (security)
- Use appropriate HTTP status codes
- Validate input before database operations

### Dual-Role Feature Development

**When adding features to template pages:**
1. Determine if feature is admin-only, professor-only, or shared
2. Use conditional rendering based on `userRole` state
3. Call different APIs based on role
4. Test both admin and professor flows
5. Verify sidebar stays consistent with user's role

**Pattern:**
```typescript
const [userRole, setUserRole] = useState<'admin' | 'professor'>('admin')

// Detection on mount
useEffect(() => { detectRole() }, [])

// Conditional UI
{userRole === 'admin' ? (
  <AdminOnlyFeature />
) : (
  <ProfessorOnlyFeature />
)}

// Conditional API
const endpoint = userRole === 'admin'
  ? '/api/admin/endpoint'
  : '/api/professor/endpoint'
```

---

## 12. Student View Synchronization

### How Student Views Stay Current

**Auto-Refresh on Page Load:**
- Every student page fetches fresh data from API
- No client-side caching of module structure or assessments
- Only UI state (last viewed class) stored in localStorage

### Data Freshness Patterns

#### Modules Page
**URL:** `/student/classes/[classId]/modules`

**Behavior:**
```typescript
useEffect(() => {
  if (classId) {
    fetchModules() // Fresh API call
  }
}, [classId])
```

**API Filtering:**
- Only published modules shown
- Only published module items shown
- Assessments filtered by module item publish status

**Result:** Student sees professor's current module structure on every page load.

#### Grades Page
**URL:** `/student/grades`

**Behavior:**
- Fetches from `AssessmentSubmission` table directly
- Not dependent on module structure
- Always shows current grades

**Immune to:**
- Module deletions
- Assessment removal from modules
- Module reordering

#### Assignments Page
**URL:** `/student/assignments`

**Behavior:**
- Deduplicates assessments by ID
- Shows assessments linked to published module items
- Filters unpublished assessments

**Updates When:**
- Professor publishes/unpublishes module item
- Professor adds assessment to module
- Professor changes assessment due date

### What Happens When Professor Makes Changes

| Professor Action | Student Experience | Timing |
|------------------|-------------------|--------|
| Adds module | Appears on next page load | Immediate (on refresh) |
| Deletes module | Disappears on next page load | Immediate (on refresh) |
| Publishes module item | Item appears in module | Immediate (on refresh) |
| Unpublishes module item | Item disappears | Immediate (on refresh) |
| Reorders modules | New order visible | Immediate (on refresh) |
| Reorders items | New order visible | Immediate (on refresh) |
| Adds assessment to module | Assessment appears in assignments | Immediate (on refresh) |
| Removes assessment from module | Assessment stays in grades, removed from module view | Grades preserved |
| Changes due date | New due date shown | Immediate (on refresh) |
| Grades submission | Grade appears in grades page | Immediate (on refresh) |

### No Stale Data Mechanisms

**What's NOT cached:**
- Module structure
- Module items
- Assessment list
- Grades
- Due dates

**What IS cached (UI state only):**
- Last viewed class (localStorage)
- Assignment filter selections (localStorage)
- Component state (React state)

---

## 13. Future Development Patterns

### Adding a New Assessment Type

**Scenario:** Implementing LAB, QUIZ, EXAM, or INTERACTIVE_LESSON functionality.

**Pre-existing Infrastructure:**
✅ Type selection UI (admin + professor)
✅ Routing logic (`/student/assignments/[id]/page.tsx`)
✅ Student page exists (e.g., `/submit`, `/take`, `/lesson`)
✅ Database model supports all types
✅ Template pages exist for all types

**What You Need to Build:**

1. **Student Page Functionality:**
   - File: `/app/student/assignments/[assessmentId]/{type}/page.tsx`
   - Reference: `/discussion/page.tsx` (fully implemented)
   - Requirements:
     - Fetch assessment details
     - Display type-specific UI (code editor, quiz questions, etc.)
     - Handle submission
     - Show previous attempts (if multiple allowed)
     - Show grade/feedback (if graded)

2. **Professor Grading Interface:**
   - File: Create `/app/professor/assessments/[assessmentId]/{type}-grading/page.tsx`
   - OR: Extend existing grading page with type-specific views
   - Requirements:
     - List all submissions
     - Display student work
     - Input grade and feedback
     - Save grade via API

3. **API Endpoints (if needed):**
   - May reuse existing submission endpoints
   - Add type-specific validation
   - Handle file uploads (LAB)
   - Handle auto-grading (QUIZ)

**Checklist:**
- [ ] Read DISCUSSION implementation as reference
- [ ] Build student submission UI
- [ ] Build professor grading UI
- [ ] Test submission → grading → grade display flow
- [ ] Verify completion tracking works
- [ ] Update this documentation with new patterns

### Adding Admin Features

**When to add to admin:**
- Managing course-level templates
- Platform-wide settings
- User management

**Where to add:**
- Course-related: Add to `/admin/courses/[courseId]` tabs
- User-related: `/admin/people`
- New resource: Consider if it belongs in course context first

**Pattern:**
1. Add to appropriate existing page (don't create new top-level pages)
2. Use compact card design for listings
3. Use modals for create/edit operations
4. Follow admin API pattern: `/api/admin/{resource}`

### Adding Professor Features

**When to add to professor:**
- Class-specific management (not course-wide)
- Content for their students
- Grading and feedback

**Pattern:**
1. Determine scope: Class-level or assessment-level
2. Use existing pages when possible (modules, assessments, grading)
3. Follow professor API pattern: `/api/professor/classes/[classId]/{resource}`
4. Ensure student view updates properly
5. Consider if feature belongs in dual-role template pages

**Example: Adding Rubrics**
- Don't create `/professor/rubrics` page
- Add rubrics management to grading page
- Store rubrics at class level
- Link to assessments

### Adding Student Features

**When to add to student:**
- Viewing content
- Completing assessments
- Tracking progress

**Pattern:**
1. Always fetch fresh data (no caching)
2. Filter unpublished content at API level
3. Use existing pages when possible
4. Follow student API pattern: `/api/student/{resource}`

**Example: Adding Announcements**
- Add announcements section to dashboard
- Fetch via `/api/student/announcements`
- Professor creates via class management page
- No separate announcements page needed

### Extending Module System

**Scenarios:**
- Adding new ModuleItemType
- Adding new module features (prerequisites, adaptive release)
- Adding more completion requirements

**Pattern:**
1. Update Prisma schema (both template and instance models)
2. Update admin template forms
3. Update professor instance forms
4. Update student display
5. Test cloning process (template → instance)

**Example: Adding QUIZ ModuleItemType**
- Add to `ModuleItemType` enum
- Update ModuleItemTemplateForm
- Update ModuleItemForm
- Update ModuleItemRow display
- Handle in student view

### Creating Shared Components

**When to create in `/components/modules/*`:**
- Used by both admin and professor
- Displays data the same way for both
- Student read-only view

**When to create in `/components/shared/*`:**
- Used across multiple roles
- Utility component (selectors, inputs)
- Not module-specific

**Example patterns:**
- `ModuleAccordion` - Displays modules for admin, professor, student
- `ModuleItemRow` - Displays individual items
- `ClassSelector` - Allows professor to select class
- `ModuleCompletionBadge` - Shows completion status

**When to create role-specific:**
- Different UI for different roles
- Role-specific actions
- Role-specific data access

---

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint

# Prisma commands
npx prisma generate     # Regenerate client after schema changes
npx prisma db push      # Push schema changes to database
npx prisma studio       # Open Prisma Studio (database GUI)

# Seed database
npm run seed            # Run seed script (if configured)
```

---

## Environment Variables

**Required:**
```env
DATABASE_URL="postgresql://..."
JWT_SECRET="your-secret-key"

GCS_PROJECT_ID="your-project-id"
GCS_SERVICE_ACCOUNT_EMAIL="your-email@project.iam.gserviceaccount.com"
GCS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GCS_BUCKET_NAME="your-bucket-name"
```

**Notes:**
- Never commit `.env` to git
- Use `.env.local` for local development
- Regenerate JWT_SECRET for production

---

## Final Notes

**This document is the source of truth.** Before implementing any feature:

1. Read relevant sections of this document
2. Check existing implementations for patterns
3. Follow established conventions
4. Update this document if you establish new patterns

**Questions to ask before coding:**
- Does a similar component already exist?
- Which role is this for? (admin/professor/student)
- Does this fit the template vs instance model?
- Will this affect student progress tracking?
- Is this creating a new page or extending existing?
- Does this feature belong in dual-role template pages?

**When in doubt:**
- Look at DISCUSSION implementation (reference for assessment types)
- Look at ModuleAccordion (reference for shared components)
- Look at student dashboard (reference for design patterns)
- Look at template pages (reference for dual-role patterns)
- Look at ClassSelector (reference for shared utilities)
- Ask the user for clarification

---

**Last Updated:** 2025-11-30
**Version:** 2.1 (Dual-Role Template System)
