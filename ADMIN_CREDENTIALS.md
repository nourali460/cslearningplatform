# CS Learning Platform - Admin Credentials

## Primary Admin Account

- **Email**: `subscriptionsnova@gmail.com`
- **Password**: `admin123`
- **Full Name**: Nour Ali
- **Role**: admin

## Login Instructions

1. Navigate to: http://localhost:3000/admin-login
2. Enter the email: `subscriptionsnova@gmail.com`
3. Enter the password: `admin123`
4. You will be redirected to the admin dashboard

## Admin Capabilities

- View all users, courses, classes, and assessments
- Approve professor accounts
- Manage assessment templates for courses
- Monitor system-wide statistics
- Access Prisma Studio for direct database management

## Initialization Scripts

To ensure the admin user exists, run:

```bash
npx ts-node --compiler-options '{"module":"commonjs"}' scripts/init-admin.ts
```

To verify admin details:

```bash
npx ts-node --compiler-options '{"module":"commonjs"}' scripts/check-admin.ts
```

## Database Reset

If you need to reset the database and recreate the admin:

```bash
npx prisma migrate reset --force
```

This will:
- Drop all tables
- Run all migrations
- Execute the seed script (which creates the admin user automatically)

---

**Last Updated**: November 24, 2025
