# Comprehensive Testing Strategy Plan

**Date**: 2025-01-27  
**Status**: 📋 **PLAN**  
**Goal**: 100% test coverage with real database operations (no mocks)

---

## Executive Summary

This document outlines a comprehensive testing strategy for the Renderiq codebase using **Vitest** for unit/integration tests and **Playwright** for end-to-end tests. The strategy emphasizes **real database operations** instead of mocks, ensuring tests validate actual system behavior.

### Key Principles

1. **No Mocks for Database**: Use actual PostgreSQL database with test isolation
2. **Real File Operations**: Test actual file read/write operations
3. **100% Coverage Goal**: Achieve complete coverage across all layers
4. **Test Isolation**: Each test runs in isolation with proper cleanup
5. **Fast Feedback**: Optimize test execution speed while maintaining reliability

---

## Testing Infrastructure Setup

### 1. Dependencies Installation

```bash
npm install -D vitest @vitest/ui @vitest/coverage-v8 @playwright/test
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install -D jsdom happy-dom
npm install -D @types/node
```

### 2. Test Database Configuration

**Environment Variables** (`.env.test`):
```env
DATABASE_URL=postgresql://user:password@localhost:5432/renderiq_test
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=test_anon_key
SUPABASE_SERVICE_ROLE_KEY=test_service_role_key
NODE_ENV=test
```

**Test Database Setup**:
- Separate test database: `renderiq_test`
- Automatic schema migration before test suite
- Transaction rollback for test isolation
- Database cleanup utilities

### 3. Vitest Configuration

**File**: `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node', // Use 'jsdom' for component tests
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/dist/',
        '**/.next/',
        '**/coverage/',
        '**/drizzle/',
        '**/scripts/',
      ],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
    testTimeout: 30000,
    hookTimeout: 30000,
    teardownTimeout: 30000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
```

### 4. Playwright Configuration

**File**: `playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## Test Organization Structure

```
tests/
├── setup.ts                    # Global test setup
├── fixtures/                   # Test fixtures and factories
│   ├── database.ts            # Database setup/teardown utilities
│   ├── users.ts               # User factory
│   ├── projects.ts            # Project factory
│   ├── renders.ts             # Render factory
│   └── auth.ts                # Auth helpers
├── helpers/                    # Test helper functions
│   ├── db-helper.ts           # Database transaction helpers
│   ├── file-helper.ts         # File operation helpers
│   └── api-helper.ts          # API request helpers
├── unit/                       # Unit tests
│   ├── dal/                   # Data Access Layer tests
│   ├── types/                 # Type validation tests
│   ├── utils/                 # Utility function tests
│   └── services/              # Service layer tests
├── integration/                # Integration tests
│   ├── actions/               # Server actions tests
│   ├── api/                   # API route tests
│   ├── hooks/                 # React hooks tests
│   └── services/              # Service integration tests
├── e2e/                        # End-to-end tests
│   ├── auth.spec.ts           # Authentication flows
│   ├── render.spec.ts         # Render creation flows
│   ├── projects.spec.ts       # Project management flows
│   ├── billing.spec.ts        # Billing/payment flows
│   └── canvas.spec.ts         # Canvas workflows
└── coverage/                   # Coverage reports (generated)
```

---

## Testing Strategy by Layer

### 1. DAL (Data Access Layer) Tests

**Location**: `tests/unit/dal/`

**Strategy**:
- Test all CRUD operations with real database
- Test query optimizations (JOINs, subqueries)
- Test transaction handling
- Test error handling and edge cases
- Test database constraints and validations

**Example Test Structure**:
```typescript
// tests/unit/dal/users.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { UsersDAL } from '@/lib/dal/users';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { setupTestDB, teardownTestDB, createTestUser } from '../../fixtures/database';

describe('UsersDAL', () => {
  beforeEach(async () => {
    await setupTestDB();
  });

  afterEach(async () => {
    await teardownTestDB();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
      };
      
      const user = await UsersDAL.create(userData);
      
      expect(user).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.id).toBeDefined();
    });

    it('should throw error on duplicate email', async () => {
      const userData = { email: 'duplicate@example.com', name: 'User 1' };
      await UsersDAL.create(userData);
      
      await expect(UsersDAL.create(userData)).rejects.toThrow();
    });
  });

  describe('getById', () => {
    it('should return user by id', async () => {
      const testUser = await createTestUser();
      const user = await UsersDAL.getById(testUser.id);
      
      expect(user).toBeDefined();
      expect(user?.id).toBe(testUser.id);
    });

    it('should return null for non-existent user', async () => {
      const user = await UsersDAL.getById('non-existent-id');
      expect(user).toBeNull();
    });
  });

  // ... more tests
});
```

**Files to Test**:
- `lib/dal/users.ts`
- `lib/dal/projects.ts`
- `lib/dal/renders.ts`
- `lib/dal/render-chains.ts`
- `lib/dal/canvas.ts`
- `lib/dal/canvas-files.ts`
- `lib/dal/billing.ts`
- `lib/dal/ambassador.ts`
- `lib/dal/tools.ts`
- `lib/dal/activity.ts`
- `lib/dal/auth.ts`
- `lib/dal/project-rules.ts`

### 2. Types Tests

**Location**: `tests/unit/types/`

**Strategy**:
- Test Zod schema validations
- Test type inference
- Test error messages
- Test edge cases and boundary conditions

**Example**:
```typescript
// tests/unit/types/render.test.ts
import { describe, it, expect } from 'vitest';
import { createRenderSchema, uploadSchema } from '@/lib/types';

describe('Render Types', () => {
  describe('createRenderSchema', () => {
    it('should validate valid render data', () => {
      const validData = {
        prompt: 'A beautiful landscape',
        projectId: '123e4567-e89b-12d3-a456-426614174000',
        settings: {
          style: 'realistic',
          quality: 'high',
          aspectRatio: '16:9',
        },
      };
      
      const result = createRenderSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid quality', () => {
      const invalidData = {
        prompt: 'Test',
        projectId: '123e4567-e89b-12d3-a456-426614174000',
        settings: {
          quality: 'invalid',
        },
      };
      
      const result = createRenderSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
```

**Files to Test**:
- `lib/types/auth.ts`
- `lib/types/canvas.ts`
- `lib/types/render.ts`
- `lib/types/render-chain.ts`
- `lib/types/index.ts`

### 3. Utils Tests

**Location**: `tests/unit/utils/`

**Strategy**:
- Test pure functions with various inputs
- Test edge cases and error handling
- Test file operations with real files
- Test utility functions in isolation

**Example**:
```typescript
// tests/unit/utils/currency.test.ts
import { describe, it, expect } from 'vitest';
import { formatCurrency, convertCurrency } from '@/lib/utils/currency';

describe('Currency Utils', () => {
  describe('formatCurrency', () => {
    it('should format INR currency', () => {
      expect(formatCurrency(1000, 'INR')).toBe('₹1,000.00');
    });

    it('should format USD currency', () => {
      expect(formatCurrency(1000, 'USD')).toBe('$1,000.00');
    });
  });
});
```

**Files to Test**:
- All files in `lib/utils/` (39 files)

### 4. Actions Tests

**Location**: `tests/integration/actions/`

**Strategy**:
- Test server actions with real database
- Test authentication checks
- Test validation and error handling
- Test business logic integration
- Test revalidation and cache updates

**Example**:
```typescript
// tests/integration/actions/projects.actions.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createProject } from '@/lib/actions/projects.actions';
import { setupTestDB, teardownTestDB, createTestUser, createTestSession } from '../../fixtures/database';

describe('Projects Actions', () => {
  let testUser: any;
  let session: any;

  beforeEach(async () => {
    await setupTestDB();
    testUser = await createTestUser();
    session = await createTestSession(testUser.id);
  });

  afterEach(async () => {
    await teardownTestDB();
  });

  describe('createProject', () => {
    it('should create a new project', async () => {
      const formData = new FormData();
      formData.append('projectName', 'Test Project');
      formData.append('userId', testUser.id);
      
      const result = await createProject(formData);
      
      expect(result.success).toBe(true);
      expect(result.project).toBeDefined();
    });

    it('should reject unauthenticated requests', async () => {
      const formData = new FormData();
      formData.append('projectName', 'Test Project');
      
      const result = await createProject(formData);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Authentication');
    });
  });
});
```

**Files to Test**:
- All files in `lib/actions/` (18 files)

### 5. Hooks Tests

**Location**: `tests/integration/hooks/`

**Strategy**:
- Test React hooks with React Testing Library
- Test state management
- Test side effects
- Test error handling
- Test cleanup functions

**Example**:
```typescript
// tests/integration/hooks/use-projects.test.tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useProjects } from '@/lib/hooks/use-projects';
import { setupTestDB, createTestUser, createTestProject } from '../../fixtures/database';

describe('useProjects', () => {
  beforeEach(async () => {
    await setupTestDB();
  });

  it('should fetch user projects', async () => {
    const user = await createTestUser();
    await createTestProject(user.id);
    
    const { result } = renderHook(() => useProjects(user.id));
    
    await waitFor(() => {
      expect(result.current.projects).toBeDefined();
      expect(result.current.projects.length).toBeGreaterThan(0);
    });
  });
});
```

**Files to Test**:
- All files in `lib/hooks/` (50+ files)

### 6. API Routes Tests

**Location**: `tests/integration/api/`

**Strategy**:
- Test API endpoints with real database
- Test request/response handling
- Test authentication middleware
- Test error responses
- Test rate limiting
- Test webhook handling

**Example**:
```typescript
// tests/integration/api/renders.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { POST } from '@/app/api/renders/route';
import { setupTestDB, teardownTestDB, createTestUser, createTestSession } from '../../fixtures/database';

describe('POST /api/renders', () => {
  beforeEach(async () => {
    await setupTestDB();
  });

  afterEach(async () => {
    await teardownTestDB();
  });

  it('should create a render', async () => {
    const user = await createTestUser();
    const session = await createTestSession(user.id);
    
    const request = new Request('http://localhost:3000/api/renders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `session=${session.token}`,
      },
      body: JSON.stringify({
        prompt: 'Test render',
        projectId: 'test-project-id',
      }),
    });
    
    const response = await POST(request);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
```

**Files to Test**:
- All API routes in `app/api/` (30+ routes)

### 7. Components Tests

**Location**: `tests/integration/components/`

**Strategy**:
- Test component rendering
- Test user interactions
- Test props handling
- Test state management
- Test accessibility

**Example**:
```typescript
// tests/integration/components/button.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/ui/button';

describe('Button Component', () => {
  it('should render button with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should handle click events', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(<Button onClick={handleClick}>Click me</Button>);
    await user.click(screen.getByText('Click me'));
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

**Files to Test**:
- All components in `components/` (250+ files)

### 8. Routes/Pages Tests

**Location**: `tests/integration/routes/`

**Strategy**:
- Test page rendering
- Test server component data fetching
- Test route parameters
- Test redirects
- Test error boundaries

**Example**:
```typescript
// tests/integration/routes/dashboard.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import DashboardPage from '@/app/dashboard/page';

describe('Dashboard Page', () => {
  it('should render dashboard', async () => {
    const page = await DashboardPage();
    render(page);
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });
});
```

---

## End-to-End Testing Strategy

### E2E Test Categories

1. **Authentication Flows** (`tests/e2e/auth.spec.ts`)
   - User signup
   - User login
   - Password reset
   - Email verification
   - OAuth flows

2. **Render Flows** (`tests/e2e/render.spec.ts`)
   - Create render
   - View render history
   - Edit render settings
   - Delete render
   - Render variants

3. **Project Management** (`tests/e2e/projects.spec.ts`)
   - Create project
   - Update project
   - Delete project
   - Project settings
   - Project sharing

4. **Billing & Payments** (`tests/e2e/billing.spec.ts`)
   - View pricing
   - Purchase credits
   - Subscription management
   - Invoice generation
   - Payment history

5. **Canvas Workflows** (`tests/e2e/canvas.spec.ts`)
   - Create canvas file
   - Add nodes
   - Connect nodes
   - Execute workflow
   - Export workflow

6. **Tools & Apps** (`tests/e2e/tools.spec.ts`)
   - Browse tools
   - Use tool
   - Tool settings
   - Tool history

### E2E Test Example

```typescript
// tests/e2e/render.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Render Creation Flow', () => {
  test('should create a new render', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Navigate to render page
    await page.goto('/render');
    await expect(page.locator('h1')).toContainText('Create Render');
    
    // Fill render form
    await page.fill('textarea[name="prompt"]', 'A beautiful sunset');
    await page.selectOption('select[name="quality"]', 'high');
    await page.click('button[type="submit"]');
    
    // Verify render creation
    await expect(page.locator('.render-status')).toContainText('Processing');
  });
});
```

---

## Database Testing Utilities

### Test Database Setup

**File**: `tests/fixtures/database.ts`

```typescript
import { db } from '@/lib/db';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/lib/db/schema';
import { migrate } from 'drizzle-orm/postgres-js/migrator';

let testDb: ReturnType<typeof drizzle<typeof schema>>;
let testClient: ReturnType<typeof postgres>;

export async function setupTestDB() {
  const connectionString = process.env.DATABASE_URL!;
  
  testClient = postgres(connectionString, {
    max: 1,
    prepare: false,
  });
  
  testDb = drizzle(testClient, { schema });
  
  // Run migrations
  await migrate(testDb, { migrationsFolder: './drizzle' });
  
  // Clean database
  await cleanDatabase();
}

export async function teardownTestDB() {
  await cleanDatabase();
  if (testClient) {
    await testClient.end();
  }
}

export async function cleanDatabase() {
  // Delete in reverse order of dependencies
  await testDb.delete(schema.renders);
  await testDb.delete(schema.renderChains);
  await testDb.delete(schema.projects);
  await testDb.delete(schema.userCredits);
  await testDb.delete(schema.users);
  // ... clean all tables
}

export async function createTestUser(data?: Partial<schema.NewUser>) {
  const [user] = await testDb.insert(schema.users).values({
    email: `test-${Date.now()}@example.com`,
    name: 'Test User',
    ...data,
  }).returning();
  
  return user;
}

export async function createTestProject(userId: string, data?: Partial<schema.NewProject>) {
  const [project] = await testDb.insert(schema.projects).values({
    userId,
    name: 'Test Project',
    slug: `test-project-${Date.now()}`,
    ...data,
  }).returning();
  
  return project;
}

// ... more factory functions
```

---

## Coverage Goals & Tracking

### Coverage Thresholds

- **Lines**: 100%
- **Functions**: 100%
- **Branches**: 100%
- **Statements**: 100%

### Coverage Reports

1. **HTML Report**: `coverage/index.html`
2. **LCOV Report**: `coverage/lcov.info` (for CI/CD)
3. **JSON Report**: `coverage/coverage-final.json`

### Coverage Commands

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:watch": "vitest --watch",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:all": "npm run test:coverage && npm run test:e2e"
  }
}
```

---

## CI/CD Integration

### GitHub Actions Workflow

**File**: `.github/workflows/test.yml`

```yaml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: renderiq_test
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - run: npm ci
      - run: npm run db:migrate
      - run: npm run test:coverage
      
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Test Execution Strategy

### Development Workflow

1. **Write tests first** (TDD approach)
2. **Run tests in watch mode** during development
3. **Run full test suite** before commits
4. **Check coverage** before merging PRs

### Test Execution Order

1. **Unit Tests** (fastest, run first)
   - DAL tests
   - Types tests
   - Utils tests

2. **Integration Tests** (medium speed)
   - Actions tests
   - API tests
   - Hooks tests
   - Services tests

3. **Component Tests** (slower)
   - Component rendering
   - User interactions

4. **E2E Tests** (slowest, run last)
   - Full user flows
   - Cross-browser testing

---

## Implementation Phases

### Phase 1: Infrastructure Setup (Week 1)
- [ ] Install testing dependencies
- [ ] Configure Vitest
- [ ] Configure Playwright
- [ ] Set up test database
- [ ] Create test utilities and fixtures
- [ ] Set up CI/CD pipeline

### Phase 2: DAL & Types Testing (Week 2)
- [ ] Test all DAL files (11 files)
- [ ] Test all type schemas (4 files)
- [ ] Achieve 100% coverage for DAL and types

### Phase 3: Utils & Services Testing (Week 3)
- [ ] Test all utility functions (39 files)
- [ ] Test all service files (20+ files)
- [ ] Achieve 100% coverage for utils and services

### Phase 4: Actions & Hooks Testing (Week 4)
- [ ] Test all server actions (18 files)
- [ ] Test all React hooks (50+ files)
- [ ] Achieve 100% coverage for actions and hooks

### Phase 5: API Routes Testing (Week 5)
- [ ] Test all API routes (30+ routes)
- [ ] Test authentication middleware
- [ ] Test error handling
- [ ] Achieve 100% coverage for API routes

### Phase 6: Components Testing (Week 6-7)
- [ ] Test UI components (250+ files)
- [ ] Test user interactions
- [ ] Test accessibility
- [ ] Achieve 100% coverage for components

### Phase 7: E2E Testing (Week 8)
- [ ] Write E2E tests for critical flows
- [ ] Test cross-browser compatibility
- [ ] Test mobile responsiveness

### Phase 8: Coverage & Optimization (Week 9)
- [ ] Achieve 100% coverage across all layers
- [ ] Optimize test execution speed
- [ ] Document testing patterns
- [ ] Create testing guidelines

---

## Best Practices

### 1. Test Isolation
- Each test should be independent
- Use database transactions for isolation
- Clean up after each test

### 2. Test Naming
- Use descriptive test names
- Follow pattern: `should [expected behavior] when [condition]`
- Group related tests with `describe` blocks

### 3. Test Data
- Use factories for test data creation
- Avoid hardcoded values
- Use realistic test data

### 4. Assertions
- Use specific assertions
- Test both positive and negative cases
- Test edge cases and boundaries

### 5. Performance
- Keep tests fast (< 1s per test)
- Use parallel execution
- Optimize database queries in tests

### 6. Maintenance
- Update tests when code changes
- Remove obsolete tests
- Refactor tests regularly

---

## Monitoring & Reporting

### Test Metrics

1. **Coverage Metrics**
   - Line coverage
   - Function coverage
   - Branch coverage
   - Statement coverage

2. **Test Execution Metrics**
   - Total test count
   - Pass/fail rate
   - Execution time
   - Flaky test detection

3. **Quality Metrics**
   - Test maintainability
   - Test readability
   - Test performance

### Reporting Tools

- **Vitest UI**: Interactive test runner
- **Playwright Report**: HTML test report
- **Codecov**: Coverage tracking
- **GitHub Actions**: CI/CD status

---

## Conclusion

This comprehensive testing strategy provides a roadmap for achieving 100% test coverage across all layers of the Renderiq codebase. By using real database operations and actual file I/O, we ensure that tests validate actual system behavior rather than mocked implementations.

The phased approach allows for incremental implementation while maintaining development velocity. The emphasis on test isolation, proper cleanup, and realistic test data ensures reliable and maintainable tests.

**Next Steps**:
1. Review and approve this strategy
2. Set up testing infrastructure
3. Begin Phase 1 implementation
4. Establish testing guidelines for the team

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-27  
**Owner**: Development Team

