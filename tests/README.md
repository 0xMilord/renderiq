# Testing Infrastructure

This directory contains comprehensive tests for the Renderiq codebase using Vitest and Playwright.

## Structure

```
tests/
├── setup.ts                    # Global test setup
├── fixtures/                   # Test fixtures and factories
│   └── database.ts            # Database setup/teardown utilities
├── helpers/                    # Test helper functions
│   ├── db-helper.ts           # Database transaction helpers
│   ├── file-helper.ts         # File operation helpers
│   ├── api-helper.ts          # API request helpers
│   └── db-override.ts         # Database override for testing
├── unit/                       # Unit tests
│   ├── dal/                   # Data Access Layer tests
│   ├── types/                 # Type validation tests
│   └── utils/                 # Utility function tests
├── integration/                # Integration tests
│   ├── actions/               # Server actions tests
│   ├── api/                   # API route tests
│   ├── hooks/                 # React hooks tests
│   └── services/              # Service integration tests
└── e2e/                        # End-to-end tests
    ├── auth.spec.ts           # Authentication flows
    └── render.spec.ts         # Render creation flows
```

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up test database:**
   - Create a test database: `createdb renderiq_test`
   - Copy `.env.test.example` to `.env.test`
   - Update `DATABASE_URL` in `.env.test` with your test database credentials

3. **Run migrations:**
   ```bash
   npm run db:migrate
   ```

## Running Tests

### Unit and Integration Tests (Vitest)

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests with UI
npm run test:ui

# Run specific test file
npm test tests/unit/dal/users.test.ts
```

### End-to-End Tests (Playwright)

```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests in debug mode
npm run test:e2e:debug

# Run specific test file
npx playwright test tests/e2e/auth.spec.ts
```

### Run All Tests

```bash
npm run test:all
```

## Test Coverage

We aim for 100% test coverage across all layers:

- **Lines**: 100%
- **Functions**: 100%
- **Branches**: 100%
- **Statements**: 100%

View coverage reports:
```bash
npm run test:coverage
# Open coverage/index.html in browser
```

## Writing Tests

### Unit Tests

Unit tests should:
- Test individual functions in isolation
- Use real database operations (no mocks)
- Cover all edge cases and error scenarios
- Be fast (< 1s per test)

Example:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { UsersDAL } from '@/lib/dal/users';
import { setupTestDB, teardownTestDB, createTestUser } from '../fixtures/database';

describe('UsersDAL', () => {
  beforeEach(async () => {
    await setupTestDB();
  });

  afterEach(async () => {
    await teardownTestDB();
  });

  it('should create a new user', async () => {
    const user = await UsersDAL.create({
      email: 'test@example.com',
      name: 'Test User',
    });
    
    expect(user).toBeDefined();
    expect(user.email).toBe('test@example.com');
  });
});
```

### Integration Tests

Integration tests should:
- Test interactions between multiple modules
- Use real database and services
- Test complete workflows
- Verify data consistency

### E2E Tests

E2E tests should:
- Test complete user workflows
- Use real browser automation
- Test across multiple browsers
- Verify UI interactions

## Best Practices

1. **Test Isolation**: Each test should be independent and clean up after itself
2. **Real Operations**: Use actual database operations, not mocks
3. **Edge Cases**: Test boundary conditions and error scenarios
4. **Descriptive Names**: Use clear, descriptive test names
5. **Fast Execution**: Keep tests fast for quick feedback
6. **Coverage**: Aim for 100% coverage but prioritize meaningful tests

## CI/CD

Tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests

See `.github/workflows/test.yml` for CI configuration.

## Troubleshooting

### Database Connection Issues

- Ensure test database exists: `createdb renderiq_test`
- Check `DATABASE_URL` in `.env.test`
- Verify PostgreSQL is running: `pg_isready`

### Test Failures

- Check test database is clean: Tests should clean up automatically
- Verify migrations are up to date: `npm run db:migrate`
- Check for port conflicts: Ensure test database uses different port if needed

### E2E Test Issues

- Ensure dev server is running: `npm run dev`
- Check browser installation: `npx playwright install`
- Verify base URL in `playwright.config.ts`

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library Documentation](https://testing-library.com/)



