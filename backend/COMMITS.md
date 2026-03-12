# Git commit messages for changes made while implementing auth

- feat: add User model with studentId, password hashing, and compare method
- feat: add auth controller with register, login, and profile endpoints
- feat: add JWT auth middleware and role-based authorization
- feat: add auth routes for /api/auth/login, /api/auth/register, /api/auth/profile
- chore: register auth routes and error handler in server.ts
- fix: URL-encode MONGO_URI password in .env
- chore: update package.json with bcryptjs and jsonwebtoken dependencies
