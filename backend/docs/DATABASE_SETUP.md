# Database Setup Guide

## Overview

This project uses **Sequelize ORM** with **MySQL** for database management. The setup is designed with security, scalability, and ease of use in mind.

## Prerequisites

1. **MySQL Server** installed and running
2. **Node.js** v14+ installed
3. **npm** or **yarn** package manager

## Initial Setup

### 1. Create Database

Connect to MySQL and create the database:

```sql
CREATE DATABASE atmarakshak CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

For testing (optional):
```sql
CREATE DATABASE atmarakshak_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and update with your credentials:

```bash
cp .env.example .env
```

Edit `.env`:
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=atmarakshak
DB_USER=root
DB_PASSWORD=your_secure_password
```

### 3. Install Dependencies

```bash
npm install
```

This will install:
- `sequelize` - ORM framework
- `mysql2` - MySQL client for Node.js

### 4. Start Server

The tables will be automatically created when you start the server:

```bash
npm run dev
```

The server will:
1. Test database connection
2. Sync models (create tables)
3. Start the HTTP server

## Project Structure

```
backend/
├── config/
│   ├── database.js          # Database configuration for all environments
│   └── sequelize.js         # Sequelize instance and utilities
├── models/
│   ├── index.js             # Models registry and associations
│   └── .gitkeep            # Example model structure
├── utils/
│   └── database.js          # Database utility functions
├── middleware/
│   └── errorHandler.js      # Error handling middleware
└── docs/
    └── DATABASE_SETUP.md    # This file
```

## Creating Models

### Step 1: Create Model File

Create a new file in `models/` directory (e.g., `models/FireIncident.js`):

```javascript
/**
 * FireIncident Model
 */
module.exports = (sequelize, DataTypes) => {
  const FireIncident = sequelize.define('FireIncident', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    incident_id: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    severity: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      allowNull: false
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    detected_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    status: {
      type: DataTypes.ENUM('active', 'contained', 'resolved'),
      defaultValue: 'active'
    }
  }, {
    tableName: 'fire_incidents',
    indexes: [
      { fields: ['incident_id'], unique: true },
      { fields: ['severity'] },
      { fields: ['status'] },
      { fields: ['detected_at'] }
    ]
  });

  FireIncident.associate = (models) => {
    // Define relationships here
    // Example: FireIncident.hasMany(models.Frame, { foreignKey: 'incident_id' });
  };

  return FireIncident;
};
```

### Step 2: Register Model

Add to `models/index.js`:

```javascript
const FireIncident = require('./FireIncident');
db.FireIncident = FireIncident(sequelize, Sequelize.DataTypes);
```

### Step 3: Restart Server

Tables will be automatically created on next server start.

## Data Types Reference

Common Sequelize data types:

```javascript
DataTypes.STRING(length)          // VARCHAR
DataTypes.TEXT                    // TEXT
DataTypes.INTEGER                 // INT
DataTypes.BIGINT                  // BIGINT
DataTypes.FLOAT                   // FLOAT
DataTypes.DECIMAL(10, 2)          // DECIMAL
DataTypes.BOOLEAN                 // TINYINT(1)
DataTypes.DATE                    // DATETIME
DataTypes.DATEONLY               // DATE
DataTypes.ENUM('value1', 'value2') // ENUM
DataTypes.JSON                    // JSON
DataTypes.UUID                    // CHAR(36)
```

## Validation Examples

```javascript
field_name: {
  type: DataTypes.STRING,
  allowNull: false,
  unique: true,
  validate: {
    notEmpty: true,
    len: [3, 50],              // Length between 3-50
    isEmail: true,             // Email validation
    isUrl: true,               // URL validation
    isAlphanumeric: true,      // Only letters and numbers
    isNumeric: true,           // Only numbers
    isIn: [['value1', 'value2']], // Whitelist
    min: 0,                    // Minimum value
    max: 100                   // Maximum value
  }
}
```

## Associations

### One-to-Many

```javascript
// In User model
User.associate = (models) => {
  User.hasMany(models.Post, { foreignKey: 'user_id', as: 'posts' });
};

// In Post model
Post.associate = (models) => {
  Post.belongsTo(models.User, { foreignKey: 'user_id', as: 'author' });
};
```

### Many-to-Many

```javascript
// In User model
User.associate = (models) => {
  User.belongsToMany(models.Role, {
    through: 'user_roles',
    foreignKey: 'user_id'
  });
};

// In Role model
Role.associate = (models) => {
  Role.belongsToMany(models.User, {
    through: 'user_roles',
    foreignKey: 'role_id'
  });
};
```

## Database Utilities

### Transaction Example

```javascript
const { withTransaction } = require('./utils/database');

await withTransaction(async (transaction) => {
  const user = await User.create({ name: 'John' }, { transaction });
  await Profile.create({ userId: user.id }, { transaction });
});
```

### Pagination Example

```javascript
const { paginate } = require('./utils/database');
const { User } = require('./models');

const result = await paginate(User, {
  page: 1,
  pageSize: 10,
  where: { status: 'active' },
  order: [['created_at', 'DESC']]
});

console.log(result.data);        // Array of users
console.log(result.pagination);  // Pagination metadata
```

### Health Check

```javascript
const { checkDatabaseHealth } = require('./utils/database');

const health = await checkDatabaseHealth();
console.log(health.status);      // 'healthy' or 'unhealthy'
console.log(health.version);     // MySQL version
console.log(health.connections); // Active connections
```

## Security Best Practices

1. **Never commit `.env` file** - It contains sensitive credentials
2. **Use prepared statements** - Sequelize automatically uses them
3. **Validate user input** - Use Sequelize validators
4. **Use transactions** - For operations that must succeed together
5. **Enable SSL in production** - Configure in `config/database.js`
6. **Limit connection pool** - Configured per environment
7. **Hash passwords** - Never store plain text passwords
8. **Sanitize queries** - Avoid raw queries when possible

## Environment-Specific Behavior

### Development
- Verbose SQL logging enabled
- Auto-alter tables to match models
- Smaller connection pool (5 connections)

### Test
- No SQL logging
- Separate test database
- Tables dropped and recreated

### Production
- No SQL logging
- SSL/TLS connections required
- Larger connection pool (20 connections)
- Safe sync (never drop tables)

## Troubleshooting

### Connection Refused

```
Error: connect ECONNREFUSED 127.0.0.1:3306
```

**Solution**: Ensure MySQL server is running
```bash
# Windows
net start MySQL80

# macOS/Linux
sudo service mysql start
```

### Access Denied

```
Error: Access denied for user 'root'@'localhost'
```

**Solution**: Check credentials in `.env` file

### Database Does Not Exist

```
Error: Unknown database 'atmarakshak'
```

**Solution**: Create the database first
```sql
CREATE DATABASE atmarakshak;
```

### Table Already Exists

If you get table exists errors, drop and recreate:

```javascript
// In development only!
const { sequelize } = require('./config/sequelize');
await sequelize.drop();
await sequelize.sync();
```

## Migration from Development to Production

1. **Backup your data**
   ```bash
   mysqldump -u root -p atmarakshak > backup.sql
   ```

2. **Update environment variables**
   - Set `NODE_ENV=production`
   - Configure production database credentials
   - Enable SSL if required

3. **Test connection**
   ```bash
   npm start
   ```

4. **Monitor logs** for any connection or sync errors

## Additional Resources

- [Sequelize Documentation](https://sequelize.org/docs/v6/)
- [MySQL Documentation](https://dev.mysql.com/doc/)
- [Node.js MySQL2 Client](https://github.com/sidorares/node-mysql2)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Sequelize documentation
3. Check application logs for detailed error messages
