# How to Run Specific Tests

This guide shows you how to run individual test files or test categories using Vitest.

---

## Quick Reference

### **Run All Tests**
```bash
npm test                    # Watch mode (default)
npm run test:run            # Run once (no watch)
npm run test:coverage       # With coverage report
```

### **Run Specific File**
```bash
# Single file
npm test tests/unit/dal/users.test.ts

# Or with vitest directly
npx vitest tests/unit/dal/users.test.ts
```

### **Run All DAL Tests**
```bash
npm test tests/unit/dal
# Or
npx vitest tests/unit/dal
```

### **Run All Actions Tests**
```bash
npm test tests/integration/actions
# Or
npx vitest tests/integration/actions
```

### **Run All Services Tests**
```bash
npm test tests/unit/services
# Or
npx vitest tests/unit/services
```

---

## Detailed Examples

### **1. Run Single Test File**

```bash
# Unit test
npm test tests/unit/dal/users.test.ts

# Integration test
npm test tests/integration/actions/payment.actions.test.ts

# Service test
npm test tests/unit/services/render.service.test.ts
```

### **2. Run Tests by Category**

```bash
# All DAL tests
npm test tests/unit/dal

# All Actions tests
npm test tests/integration/actions

# All Services tests
npm test tests/unit/services

# All Utils tests
npm test tests/unit/utils

# All Types tests
npm test tests/unit/types

# All Hooks tests
npm test tests/integration/hooks

# All API route tests
npm test tests/integration/api
```

### **3. Run Tests Matching a Pattern**

```bash
# All payment-related tests
npm test payment

# All render-related tests
npm test render

# All auth-related tests
npm test auth
```

### **4. Run Tests by Name (grep)**

```bash
# Run tests with "create" in the name
npm test -t create

# Run tests with "user" in the name
npm test -t user

# Run tests with "should create" in the description
npm test -t "should create"
```

### **5. Run Tests in Specific Directory**

```bash
# All unit tests
npm test tests/unit

# All integration tests
npm test tests/integration

# All tests in a specific subdirectory
npm test tests/integration/api/payments
```

### **6. Run Tests with Coverage**

```bash
# Single file with coverage
npm run test:coverage tests/unit/dal/users.test.ts

# All DAL tests with coverage
npm run test:coverage tests/unit/dal
```

### **7. Run Tests Once (No Watch Mode)**

```bash
# Single file
npm run test:run tests/unit/dal/users.test.ts

# All DAL tests
npm run test:run tests/unit/dal
```

---

## Using Vitest UI

### **Open UI and Filter**

```bash
npm run test:ui
```

Then in the UI:
- Click on a test file to run it
- Use the search bar to filter tests
- Click on test suites to run specific groups

---

## Advanced Filtering

### **Multiple Patterns**

```bash
# Run tests matching multiple patterns
npm test tests/unit/dal tests/unit/services
```

### **Exclude Patterns**

```bash
# Run all tests except e2e
npm test --exclude tests/e2e
```

### **Run Tests in Parallel/Serial**

```bash
# Run in parallel (default)
npm test tests/unit/dal

# Run serially (one at a time)
npm test tests/unit/dal --no-threads
```

---

## Common Test Categories

### **DAL (Data Access Layer)**
```bash
npm test tests/unit/dal
```

**Files**:
- `tests/unit/dal/users.test.ts`
- `tests/unit/dal/projects.test.ts`
- `tests/unit/dal/renders.test.ts`
- `tests/unit/dal/auth.test.ts`
- `tests/unit/dal/billing.test.ts`
- etc.

### **Actions (Server Actions)**
```bash
npm test tests/integration/actions
```

**Files**:
- `tests/integration/actions/payment.actions.test.ts`
- `tests/integration/actions/render.actions.test.ts`
- `tests/integration/actions/projects.actions.test.ts`
- etc.

### **Services**
```bash
npm test tests/unit/services
```

**Files**:
- `tests/unit/services/render.service.test.ts`
- `tests/unit/services/canvas.service.test.ts`
- `tests/unit/services/payment-provider.factory.test.ts`
- etc.

### **Utils**
```bash
npm test tests/unit/utils
```

**Files**:
- `tests/unit/utils/currency.test.ts`
- `tests/unit/utils/security.test.ts`
- `tests/unit/utils/rate-limit.test.ts`
- etc.

### **Hooks**
```bash
npm test tests/integration/hooks
```

**Files**:
- `tests/integration/hooks/use-render-pipeline.test.tsx`
- `tests/integration/hooks/use-credits.test.tsx`
- etc.

### **API Routes**
```bash
npm test tests/integration/api
```

**Files**:
- `tests/integration/api/renders/route.test.ts`
- `tests/integration/api/payments/verify-payment.test.ts`
- etc.

---

## Tips

1. **Watch Mode**: By default, `npm test` runs in watch mode. Press `q` to quit.

2. **Update Snapshots**: If snapshot tests fail, update them with:
   ```bash
   npm test -u
   ```

3. **Verbose Output**: Get more detailed output:
   ```bash
   npm test --reporter=verbose
   ```

4. **Run Only Failed Tests**: After a test run, press `f` in watch mode to rerun only failed tests.

5. **Filter in Watch Mode**: While tests are running, type to filter by file name or test name.

---

## Examples for Your Project

### **Test a Specific DAL File**
```bash
npm test tests/unit/dal/users.test.ts
```

### **Test All Payment-Related Code**
```bash
npm test payment
```

### **Test All Render Services**
```bash
npm test tests/unit/services/render
```

### **Test All Actions**
```bash
npm test tests/integration/actions
```

### **Test with Coverage**
```bash
npm run test:coverage tests/unit/dal
```

---

## Troubleshooting

### **Tests Not Found**
- Make sure the file path is correct
- Check that the file has `.test.ts` or `.spec.ts` extension
- Verify the file is in the `include` pattern in `vitest.config.ts`

### **Tests Run Slowly**
- Use `--no-threads` to run serially (may help with database tests)
- Use `--reporter=verbose` to see which tests are slow

### **Database Connection Issues**
- Make sure `DATABASE_URL` is set in `.env.test`
- Check that PostgreSQL is running
- Verify test database exists

---

**End of Guide**

