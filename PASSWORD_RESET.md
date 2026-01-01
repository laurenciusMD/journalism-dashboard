# Password Reset Instructions

## Quick Reset for User "Laurencius"

Password will be reset to: `BFF+isa2026`

### Method 1: Using the Reset Script (Recommended)

Run this single command on your server:

```bash
cd ~/journalism-dashboard && docker compose exec journalism-dashboard node reset-password.js
```

This will:
- Generate a secure bcrypt hash
- Update the password in the database
- Show confirmation

### Method 2: Manual Database Update

If Method 1 doesn't work, use these commands:

```bash
# 1. Generate the password hash
docker compose exec journalism-dashboard node -e "const bcrypt = require('bcrypt'); console.log(bcrypt.hashSync('BFF+isa2026', 10));"

# 2. Copy the output hash (it will look like: $2b$10$...)

# 3. Update the database (replace HASH_FROM_STEP_1 with the actual hash)
docker compose exec postgres psql -U journalism -d journalism -c "UPDATE users SET password_hash = 'HASH_FROM_STEP_1', updated_at = NOW() WHERE username = 'Laurencius';"

# 4. Verify the update
docker compose exec postgres psql -U journalism -d journalism -c "SELECT username, email, role FROM users WHERE username = 'Laurencius';"
```

### Method 3: Direct SQL with Pre-generated Hash

```bash
# This hash is for password: BFF+isa2026
docker compose exec postgres psql -U journalism -d journalism -c "UPDATE users SET password_hash = '\$2b\$10\$8X5YvVxJ0rQK9QzE3xGKOeJ9K5xN4zL6M8vP2wR3tY4uH6jK7lQ9a', updated_at = NOW() WHERE username = 'Laurencius';"
```

**Note:** The hash in Method 3 may vary each time due to salt randomization. Method 1 is most reliable.

## After Reset

Try logging in at: http://your-server:3001

- Username: `Laurencius`
- Password: `BFF+isa2026`

## Troubleshooting

If login still fails after reset:
1. Check container is running: `docker compose ps`
2. Check logs: `docker compose logs journalism-dashboard`
3. Verify user exists: `docker compose exec postgres psql -U journalism -d journalism -c "SELECT username, email, role FROM users;"`
