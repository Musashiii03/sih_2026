# Database Sync Information

## How Sequelize Sync Works

When you run `npm run dev`, Sequelize automatically synchronizes your models with the database.

### Sync Modes

#### 1. **ALTER Mode (Development - Default)**
```javascript
{ alter: true, force: false }
```

**What it does:**
- ✅ **Preserves existing data**
- ✅ Adds new columns to existing tables
- ✅ Changes column types (when possible)
- ✅ Adds new tables
- ✅ Creates missing indexes
- ⚠️ May fail if changes are incompatible (e.g., adding NOT NULL to existing column with nulls)

**Example:** You add a new field to a model:
```javascript
// Before
building_type: {
  type: DataTypes.STRING(50)
}

// After - add a new field
building_category: {
  type: DataTypes.STRING(30),
  allowNull: true  // Must allow null for existing rows
}
```
Result: Column added, existing data preserved ✅

#### 2. **SAFE Mode**
```javascript
{ alter: false, force: false }
```

**What it does:**
- ✅ Creates missing tables
- ✅ Preserves all existing data
- ❌ Does NOT alter existing tables
- ❌ Does NOT add new columns

**Use when:** You only want to create new tables without touching existing ones.

#### 3. **FORCE Mode (⚠️ DANGEROUS)**
```javascript
{ alter: false, force: true }
```

**What it does:**
- ❌ **DROPS all tables**
- ❌ **DELETES all data**
- ✅ Creates fresh tables

**Use when:** Starting fresh or in testing. **NEVER in production!**

## Current Configuration

### Development (default)
```javascript
// In src/config/sequelize.js
{
  alter: true,   // Update tables safely
  force: false   // Never drop tables
}
```

**Result:** Tables update automatically, data preserved ✅

### Production
```javascript
{
  alter: false,  // No automatic changes
  force: false   // Never drop tables
}
```

**Result:** Only creates missing tables, requires migrations for schema changes.

## Safe Model Changes

### ✅ Safe Changes (ALTER mode preserves data)

1. **Adding new optional columns:**
```javascript
new_field: {
  type: DataTypes.STRING,
  allowNull: true  // ← Important: allow null
}
```

2. **Adding new tables:**
Just create a new model file - it will be created automatically.

3. **Adding indexes:**
```javascript
indexes: [
  { fields: ['email'] }  // New index added safely
]
```

4. **Widening column types:**
```javascript
// Before: VARCHAR(50)
// After: VARCHAR(100)  ✅ Safe
```

5. **Making nullable column NOT NULL (if no nulls exist):**
```javascript
// If column has no NULL values
allowNull: false  // Will work
```

### ⚠️ Risky Changes (May fail or lose data)

1. **Adding required fields to existing tables:**
```javascript
// ❌ This will fail if table has existing rows
new_required_field: {
  type: DataTypes.STRING,
  allowNull: false  // ← Can't add to existing rows
}

// ✅ Do this instead:
new_required_field: {
  type: DataTypes.STRING,
  allowNull: true,  // Allow null initially
  defaultValue: 'default_value'  // Or set a default
}
```

2. **Narrowing column types:**
```javascript
// Before: VARCHAR(100)
// After: VARCHAR(20)  ⚠️ May fail if existing data is longer
```

3. **Changing column types:**
```javascript
// Before: STRING
// After: INTEGER  ⚠️ Data conversion may fail
```

4. **Renaming columns:**
ALTER mode treats this as drop + add = **data loss!**

### 🔄 For Complex Changes: Use Migrations

For risky changes, use Sequelize migrations:

```bash
# Install Sequelize CLI
npm install --save-dev sequelize-cli

# Initialize migrations
npx sequelize-cli init

# Create a migration
npx sequelize-cli migration:generate --name add-building-category

# Edit the migration file, then run
npx sequelize-cli db:migrate
```

## Logging

Control SQL query logging with environment variable:

```bash
# .env
DB_LOGGING=false   # No SQL logs (clean output)
DB_LOGGING=true    # Show all SQL queries (debugging)
```

## Quick Reference

| Task | ALTER Mode | Data Preserved? | Notes |
|------|-----------|----------------|-------|
| Add new table | ✅ | ✅ | Automatic |
| Add optional column | ✅ | ✅ | Set `allowNull: true` |
| Add required column | ⚠️ | ⚠️ | Add with default or nullable |
| Change column type | ⚠️ | ⚠️ | May fail |
| Rename column | ❌ | ❌ | Use migration |
| Delete column | ❌ | ❌ | Use migration |
| Add index | ✅ | ✅ | Automatic |
| Add foreign key | ✅ | ✅ | Automatic |

## Testing Changes

1. **Always test model changes with data:**
```javascript
// Create test data first
await db.Building.create({ /* ... */ });

// Modify model
// Restart server
// Check data is still there
const building = await db.Building.findAll();
```

2. **Backup before major changes:**
```bash
# Backup database
docker-compose exec -T postgres pg_dump -U postgres atmarakshak > backup.sql

# If something goes wrong, restore:
docker-compose exec -T postgres psql -U postgres -d atmarakshak < backup.sql
```

## Summary

**Current setup:**
- ✅ Development: ALTER mode (data preserved, tables update automatically)
- ✅ Logs: Minimal (controlled by `DB_LOGGING`)
- ✅ Production: SAFE mode (manual migrations required)

**Safe workflow:**
1. Modify model file
2. Add optional fields or new tables
3. Run `npm run dev`
4. Tables update, data preserved ✅
