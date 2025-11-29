INSERT INTO users (id, email, password, "fullName", role, "isApproved", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'subscriptionsnova@gmail.com',
  'admin123',
  'Nour Ali',
  'admin',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;
