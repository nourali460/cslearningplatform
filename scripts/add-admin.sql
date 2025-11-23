INSERT INTO users (id, "clerkId", email, "fullName", role, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'user_35rVge67RtsAqrA0Vl4JC6F9dOW',
  'subscriptionnova@gmail.com',
  'Nour Ali',
  'admin',
  NOW(),
  NOW()
)
ON CONFLICT ("clerkId") DO NOTHING;
