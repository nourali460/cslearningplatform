# CS Learning Platform - Login Credentials & Test Accounts

## Current Users in Database

### 👑 Admin Account
- **Email**: `subscriptionnova@gmail.com`
- **Role**: Administrator
- **Status**: ✅ Approved
- **Login URL**: http://localhost:3000/admin-login (Dedicated admin login)
- **Dashboard**: http://localhost:3000/admin

**Capabilities**:
- View all users, courses, classes, and assessments
- Approve professor accounts
- Manage system-wide settings

**Note**: Admin has a dedicated login page at `/admin-login` (accessible from the homepage footer)

---

### 👨‍🏫 Professor Account (Needs Approval)
- **Email**: `prof.johnson@cslearning.edu`
- **Name**: Michael Johnson
- **Username**: michael
- **Role**: Professor
- **Status**: ⏳ Pending Admin Approval
- **Login URL**: http://localhost:3000/auth/sign-in
- **Dashboard**: http://localhost:3000/professor/pending-approval

**Note**: This professor needs to be approved by an admin before accessing the professor portal.

**To Approve**:
1. Login as admin
2. Go to Admin Portal → People
3. Find professor and click "Approve"

---

## How to Sign Up New Users

### As a Student:
1. Go to http://localhost:3000/sign-up
2. Click "Sign Up as Student"
3. Complete the Clerk signup form
4. You'll be redirected to the student dashboard

### As a Professor:
1. Go to http://localhost:3000/sign-up
2. Click "Sign Up as Professor"
3. Complete the Clerk signup form
4. You'll see a "Pending Approval" page
5. Wait for admin approval
6. Once approved, you can access the professor dashboard

### As an Admin:
- Admins cannot sign up through the public form
- Admin accounts are created manually only
- Contact the system administrator

---

## How to Login

### Admin Login:
1. Go to http://localhost:3000/admin-login (or click "Administrator Login" in the homepage footer)
2. Enter your admin email: `subscriptionnova@gmail.com`
3. Enter your password
4. You'll be redirected to the admin dashboard

### Student/Professor Login:
1. Go to http://localhost:3000/sign-in
2. Select your role (Student or Professor)
3. Click "Continue to Sign In"
4. Enter your Clerk credentials
5. You'll be redirected to your dashboard

---

## API Endpoints

### Health Check
```bash
curl http://localhost:3000/api/health
```

### Initialize Admin (Only works once)
```bash
curl http://localhost:3000/api/init-admin
```

### List All Users (Requires Database Access)
```bash
npx tsx scripts/list-users.ts
```

---

## Protected Routes

- `/admin` → Redirects to `/auth/sign-in` if not logged in as admin
- `/professor` → Redirects to `/auth/sign-in` if not logged in as professor
- `/student` → Redirects to `/auth/sign-in` if not logged in as student
- `/dashboard` → Polls for user creation and redirects based on role

---

## Common Issues & Solutions

### "User account not found" Error
**Problem**: The webhook hasn't created your user yet
**Solution**:
1. Wait a few seconds and click "Try Again"
2. Check `/api/health` to ensure database is connected
3. Check browser console for errors

### Professor Can't Access Dashboard
**Problem**: Professor account needs approval
**Solution**: Admin must approve the professor account first

### Protected Pages Show 404
**Problem**: Not logged in
**Solution**: Go to `/auth/sign-in` to login first

---

## Testing the Complete Flow

### Test Student Signup:
```bash
# Run the endpoint tests
npx tsx scripts/test-endpoints.ts
```

### Manual Test:
1. Open incognito window
2. Go to http://localhost:3000
3. Click "Sign Up"
4. Select "Student"
5. Complete signup
6. Verify redirect to student dashboard

---

## Database Commands

### View All Users:
```bash
npx tsx scripts/list-users.ts
```

### Reset Database:
```bash
npx prisma db push --force-reset
npx prisma db seed
```

### Open Prisma Studio:
```bash
npx prisma studio
```

---

## Clerk Configuration

### Sign In URL: `/auth/sign-in`
### Sign Up URL: `/auth/sign-up`
### After Sign In: `/dashboard`
### After Sign Up: `/dashboard`

---

## Important Notes

1. **Middleware Protection**: All protected routes now properly redirect to `/auth/sign-in`
2. **API Routes**: All API routes return proper JSON 401 responses when not authenticated
3. **Role Assignment**: Role is set via localStorage during signup, then processed in `/dashboard`
4. **Webhook**: Clerk webhook creates/updates users automatically
5. **Polling**: Dashboard polls for up to 20 seconds waiting for user creation

---

**Last Updated**: November 23, 2025
