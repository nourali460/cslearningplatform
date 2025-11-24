# Signup Flow - CS Learning Platform

## Overview

The signup process has been redesigned to match the proper academic workflow:
- **Students** must have a class code (invitation) to sign up
- **Professors** can sign up but need admin approval
- **Admins** are created manually only

---

## Student Signup Flow

### Step 1: Select Student Role
1. Go to http://localhost:3000/sign-up
2. Click "Sign Up as Student"

### Step 2: Enter Class Code
1. Enter the class code provided by your professor
2. Format: `CS101-FALL2024-A` (uppercase, alphanumeric)
3. Click "Continue"

### Step 3: Validation
- System validates the class code
- Shows class information if valid
- Displays error if invalid

### Step 4: Clerk Signup
- Redirected to Clerk signup form
- Enter your email and create a password
- Complete Clerk authentication

### Step 5: Auto-Enrollment
- System creates your student account
- **Automatically enrolls you in the class**
- Redirects to student dashboard

### Requirements:
- ✅ Valid class code (from professor)
- ✅ Email address
- ✅ Password

---

## Professor Signup Flow

### Step 1: Select Professor Role
1. Go to http://localhost:3000/sign-up
2. Click "Sign Up as Professor"

### Step 2: Clerk Signup
- Immediately redirected to Clerk signup form
- No class code required
- Enter your email and create a password

### Step 3: Pending Approval
- System creates your professor account
- **Status: Pending Approval**
- Redirected to pending approval page

### Step 4: Wait for Admin Approval
- Admin must approve your account
- You'll receive email notification (if configured)
- Can check status by logging in

### Step 5: Access Granted
- Once approved, access professor dashboard
- Can create classes and manage students

### Requirements:
- ✅ Email address
- ✅ Password
- ⏳ Admin approval (pending)

---

## Admin Login (No Signup)

Admins cannot sign up publicly. Admin accounts are created manually.

### How to Login:
1. Go to http://localhost:3000/admin-login
2. Enter admin email: `subscriptionnova@gmail.com`
3. Enter your password
4. Redirected to admin dashboard

---

## Technical Implementation

### API Endpoints

#### 1. `/api/validate-class-code` (POST)
- Validates class code before signup
- Returns class information
- **Public endpoint** (no auth required)

**Request:**
```json
{
  "classCode": "CS101-FALL2024-A"
}
```

**Response (Success):**
```json
{
  "valid": true,
  "classId": "123",
  "className": "CS101 - Introduction to Computer Science",
  "term": "Fall",
  "year": 2024,
  "professor": "Dr. Smith"
}
```

**Response (Error):**
```json
{
  "error": "Invalid class code. Please check with your professor."
}
```

#### 2. `/api/set-role` (POST)
- Sets user role after Clerk signup
- Enrolls student if class code provided
- **Requires authentication**

**Request (Student):**
```json
{
  "role": "student",
  "classCode": "CS101-FALL2024-A"
}
```

**Request (Professor):**
```json
{
  "role": "professor"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "456",
    "role": "student",
    "needsApproval": false
  }
}
```

### Database Schema

**Enrollment** (Auto-created for students):
```prisma
model Enrollment {
  id        String   @id @default(cuid())
  studentId String
  classId   String
  student   User     @relation(fields: [studentId], references: [id])
  class     Class    @relation(fields: [classId], references: [id])
  createdAt DateTime @default(now())

  @@unique([studentId, classId])
}
```

### LocalStorage Keys

During signup, these keys are stored temporarily:

**For Students:**
- `pendingRole`: "student"
- `pendingClassCode`: "CS101-FALL2024-A"
- `pendingClassName`: "CS101 - Introduction to Computer Science"

**For Professors:**
- `pendingRole`: "professor"

These are cleared after account creation.

---

## Testing the Flow

### Prerequisites

1. **Create a Test Class** (requires approved professor)

You'll need to:
- Approve existing professor in admin portal
- Have professor create a class
- Get the class code

### Test Student Signup

```bash
# 1. Note the class code from professor dashboard
# 2. Open incognito window
# 3. Go to http://localhost:3000/sign-up
# 4. Click "Student"
# 5. Enter class code: CS101-FALL2024-A
# 6. Complete Clerk signup
# 7. Should be enrolled automatically
```

### Test Professor Signup

```bash
# 1. Open incognito window
# 2. Go to http://localhost:3000/sign-up
# 3. Click "Professor"
# 4. Complete Clerk signup
# 5. Should see pending approval page
```

---

## Common Issues & Solutions

### Issue: "Invalid class code"
**Cause**: Class doesn't exist or wrong code
**Solution**:
1. Check class code with professor
2. Ensure class exists in database
3. Code is case-sensitive (uppercase)

### Issue: "Class code is required for student signup"
**Cause**: Trying to sign up as student without class code
**Solution**:
1. Go back to /sign-up
2. Enter valid class code
3. Complete signup process

### Issue: "Professor stuck on pending approval"
**Cause**: Admin hasn't approved yet
**Solution**:
1. Login as admin at /admin-login
2. Go to People tab
3. Find professor and click "Approve"

### Issue: "Student not enrolled after signup"
**Cause**: API error or database issue
**Solution**:
1. Check /api/health endpoint
2. Check browser console for errors
3. Student can manually enroll via student portal

---

## Security Considerations

1. **Class Code Validation**
   - Validates before allowing signup
   - Prevents invalid enrollments
   - Public endpoint (necessary for pre-auth validation)

2. **Role Protection**
   - Students must have valid class code
   - Professors need admin approval
   - Admins cannot be created via signup

3. **Auto-Enrollment**
   - Only happens on first signup
   - Tied to validated class code
   - Cannot enroll in multiple classes during signup

---

## Future Enhancements

1. **Email Invitations**
   - Professors send email invitations
   - Email contains class code
   - Click link to auto-fill code

2. **QR Code Signup**
   - Professor shows QR code
   - Students scan to get class code
   - Auto-fills signup form

3. **Bulk Student Import**
   - Admin/Professor uploads CSV
   - Auto-creates accounts
   - Sends email invitations

4. **Class Code Expiration**
   - Set expiration dates on class codes
   - Regenerate codes per semester
   - Archive old classes

---

## Current Status

✅ **Implemented:**
- Student signup with class code validation
- Professor signup with approval requirement
- Auto-enrollment on student signup
- Admin-only manual creation
- Class code validation API

⏳ **Pending:**
- Create test class for student signup testing
- Approve existing professor (prof.johnson@cslearning.edu)
- Update sign-in page messaging

---

**Last Updated**: November 23, 2025
