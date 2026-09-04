# Atmarakshak Backend API

Backend server for the Atmarakshak Fire Detection System. Built with Node.js, Express, PostgreSQL, and Sequelize ORM.

## Features

- 🔥 Fire incident frame management API
- 🚒 Nearest fire station finder (OpenStreetMap)
- 🐘 PostgreSQL database with Sequelize ORM
- 🐳 Docker containerized database
- 🔄 Auto-sync models to database
- 📊 Health monitoring endpoints
- 🔒 Connection pooling and security features

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** PostgreSQL 15
- **ORM:** Sequelize
- **Containerization:** Docker & Docker Compose
- **Dev Tools:** nodemon, pgAdmin

## Quick Start

### Prerequisites

- Node.js 16+ ([Download](https://nodejs.org/))
- Docker Desktop ([Download](https://www.docker.com/products/docker-desktop))
- Git

### Automated Setup (Windows)

```powershell
# Run the setup script
.\setup.ps1
```

This will:
1. Check prerequisites
2. Create .env file
3. Install dependencies
4. Start PostgreSQL in Docker
5. Wait for database to be ready

### Manual Setup

#### 1. Clone and Navigate

```bash
cd backend
```

#### 2. Install Dependencies

```bash
npm install
```

#### 3. Environment Configuration

```bash
# Windows PowerShell
Copy-Item .env.example .env

# Edit .env with your settings
notepad .env
```

#### 4. Start PostgreSQL

```bash
# Start PostgreSQL and pgAdmin
docker-compose up -d

# Verify containers are running
docker-compose ps

# Check logs
docker-compose logs -f postgres
```

#### 5. Start API Server

```bash
# Development mode (auto-reload + auto-sync)
npm run dev

# Production mode
npm start
```

The server will:
- Connect to PostgreSQL
- Auto-load models from `src/models/`
- Create/update database tables automatically
- Start on http://localhost:3001

## Project Structure

```
backend/
├── src/
│   ├── config/          # Database configuration
│   ├── models/          # Sequelize models (add your tables here)
│   ├── routes/          # API route definitions
│   ├── services/        # Business logic (add your services here)
│   ├── middleware/      # Express middleware
│   ├── utils/           # Utility functions
│   ├── frame_extraction/  # Python ML pipeline
│   └── ml_models/       # ML model scripts
│
├── data/                # Fire incident storage
├── docker-compose.yml   # PostgreSQL container setup
├── server.js            # Express server entry point
└── package.json         # Dependencies
```

See [STRUCTURE.md](./STRUCTURE.md) for detailed architecture documentation.

## Available Scripts

```bash
# Development server with auto-reload
npm run dev

# Production server
npm start

# Test database connection
npm run test:db
```

## API Endpoints

### Health & Status

```
GET  /health              # Server and database health
GET  /                    # API information
```

### Fire Incidents

```
GET  /api/incidents                              # List all incidents
GET  /api/incidents/:incidentId/summary          # Get incident details
GET  /api/incidents/:incidentId/frames/:index    # Get frame image
GET  /api/incidents/:incidentId/metadata         # Get detection metadata
GET  /api/incidents/:incidentId/hologram         # Get 3D hologram data
```

### Fire Stations

```
GET  /api/nearest-station?lat=28.72&lon=77.33    # Find nearest station
```

### Static Files

```
GET  /data/fire_incidents/...                    # Access stored data
```

## Database Management

### Access PostgreSQL

```bash
# Via Docker CLI
docker-compose exec postgres psql -U postgres -d atmarakshak

# Via pgAdmin Web UI
# Open: http://localhost:5050
# Login: admin@atmarakshak.com / admin
```

### Common psql Commands

```sql
-- List tables
\dt

-- Describe table
\d table_name

-- List databases
\l

-- Quit
\q
```

### Backup & Restore

```bash
# Backup
docker-compose exec -T postgres pg_dump -U postgres atmarakshak > backup.sql

# Restore
docker-compose exec -T postgres psql -U postgres -d atmarakshak < backup.sql
```

## Adding Models

### 1. Create Model File

Create `src/models/user.model.js`:

```javascript
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      validate: { isEmail: true }
    }
  }, {
    tableName: 'users',
    underscored: true,
    timestamps: true
  });

  User.associate = (models) => {
    // Define relationships
  };

  return User;
};
```

### 2. Restart Server

```bash
npm run dev
```

The table is created automatically!

### 3. Use Model

```javascript
const db = require('./src/models');
const users = await db.User.findAll();
```

See [src/models/README.md](./src/models/README.md) for detailed model documentation.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `API_PORT` | 3001 | API server port |
| `NODE_ENV` | development | Environment mode |
| `DB_HOST` | localhost | PostgreSQL host |
| `DB_PORT` | 5432 | PostgreSQL port |
| `DB_NAME` | atmarakshak | Database name |
| `DB_USER` | postgres | Database user |
| `DB_PASSWORD` | postgres | Database password |
| `API_CORS_ORIGIN` | http://localhost:5173 | CORS origin |
| `PGADMIN_PORT` | 5050 | pgAdmin web UI port |

## Docker Commands

```bash
# Start services
docker-compose up -d

# Stop services (keep data)
docker-compose stop

# View logs
docker-compose logs -f postgres

# Restart services
docker-compose restart

# Remove containers (keep data)
docker-compose down

# Remove containers + data (⚠️ DELETES ALL DATA)
docker-compose down -v

# Container stats
docker stats atmarakshak_postgres
```

## Development Workflow

### 1. **Create Models** (Database Tables)

Add model files to `src/models/`:
- `incident.model.js` - Fire incidents
- `camera.model.js` - Camera sensors
- `station.model.js` - Fire stations
- `user.model.js` - User accounts
- `alert.model.js` - Alert notifications

### 2. **Add Services** (Business Logic)

Add service files to `src/services/`:
- `incident.service.js` - Incident management
- `notification.service.js` - Alert system
- `analytics.service.js` - Data analytics

### 3. **Create Routes** (API Endpoints)

Add route files to `src/routes/`:
- `incident.routes.js` - Incident endpoints
- `user.routes.js` - User management

### 4. **Update server.js**

Import and mount new routes:
```javascript
const { incidentRoutes } = require('./src/routes');
app.use('/api', incidentRoutes);
```

## Troubleshooting

### Port Already in Use

```powershell
# Find process using port 5432
netstat -ano | findstr :5432

# Kill process
taskkill /PID <PID> /F
```

### Database Connection Failed

1. Check if PostgreSQL is running:
   ```bash
   docker-compose ps
   ```

2. Check container logs:
   ```bash
   docker-compose logs postgres
   ```

3. Verify .env credentials match

### Tables Not Created

1. Check server logs for sync errors
2. Verify model file syntax
3. Ensure model exports correct function

### pgAdmin Can't Connect

Connection settings:
- Host: `postgres` (Docker service name)
- Port: `5432`
- Database: `atmarakshak`
- Username: `postgres`
- Password: `postgres`

## Testing

```bash
# Test database connection
npm run test:db

# Test API endpoint
curl http://localhost:3001/health

# Test with Python
# (Add pytest tests in src/frame_extraction/)
pytest
```

## Production Deployment

1. **Set environment to production:**
   ```env
   NODE_ENV=production
   ```

2. **Use strong passwords:**
   ```env
   DB_PASSWORD=<strong-random-password>
   ```

3. **Enable SSL:**
   ```env
   DB_SSL_REJECT_UNAUTHORIZED=true
   ```

4. **Adjust connection pool:**
   ```javascript
   pool: { max: 20, min: 5 }
   ```

5. **Use managed PostgreSQL** (AWS RDS, Azure Database, etc.)

## Documentation

- [STRUCTURE.md](./STRUCTURE.md) - Detailed project structure
- [README_DOCKER.md](./README_DOCKER.md) - Docker setup guide
- [src/models/README.md](./src/models/README.md) - Model creation guide
- [docs/DATABASE_SETUP.md](./docs/DATABASE_SETUP.md) - Database documentation

## Contributing

1. Create feature branch
2. Add/update models, services, routes as needed
3. Test locally with `npm run dev`
4. Commit changes
5. Create pull request

## License

ISC

## Support

For issues or questions:
1. Check documentation files
2. Review error logs: `docker-compose logs`
3. Verify environment configuration
4. Test database connection: `npm run test:db`

---

Built with ❤️ for Atmarakshak Fire Detection System
