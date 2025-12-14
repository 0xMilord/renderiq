# Quick Start Guide for Testing

## Prerequisites

1. **PostgreSQL installed and running**
   - Check if running: `pg_isready` or `pg_isready -h localhost -p 5432`
   - If not running, start PostgreSQL service

2. **Test database created**
   ```bash
   # Create test database
   createdb renderiq_test
   
   # Or using psql:
   psql -U postgres -c "CREATE DATABASE renderiq_test;"
   ```

## Setup Steps

1. **Create `.env.test` file:**
   ```bash
   cp .env.test.example .env.test
   ```

2. **Update `.env.test` with your database credentials:**
   ```env
   DATABASE_URL=postgresql://postgres:your_password@localhost:5432/renderiq_test
   ```

3. **Run migrations:**
   ```bash
   npm run db:migrate
   ```

4. **Run tests:**
   ```bash
   npm test
   ```

## Troubleshooting

### Error: `ECONNREFUSED`

**Problem:** PostgreSQL is not running or not accessible.

**Solutions:**
1. Check if PostgreSQL is running:
   ```bash
   pg_isready -h localhost -p 5432
   ```

2. Start PostgreSQL:
   ```bash
   # Windows (if installed as service)
   net start postgresql-x64-15
   
   # macOS (using Homebrew)
   brew services start postgresql@15
   
   # Linux (using systemd)
   sudo systemctl start postgresql
   ```

3. Verify connection string in `.env.test`:
   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/renderiq_test
   ```

### Error: `database "renderiq_test" does not exist`

**Solution:** Create the test database:
```bash
createdb renderiq_test
```

### Error: `password authentication failed`

**Solution:** Update `.env.test` with correct password:
```env
DATABASE_URL=postgresql://postgres:your_actual_password@localhost:5432/renderiq_test
```

### Using Docker for Test Database

If you don't have PostgreSQL installed locally:

```bash
# Start PostgreSQL container
docker run --name renderiq-test-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=renderiq_test \
  -p 5432:5432 \
  -d postgres:15

# Your .env.test should be:
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/renderiq_test
```

## Running Tests Without Database

Some tests don't require a database (unit tests for utilities). You can run them separately:

```bash
# Run only unit tests (no database needed)
npm test tests/unit/utils

# Run only tests that don't need database
npm test -- --grep "unit"
```

