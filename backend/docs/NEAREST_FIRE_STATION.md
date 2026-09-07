# Nearest Fire Station Feature

## Overview

This feature automatically finds and stores the nearest fire station information for each building using a **normalized database design**. Fire station information is stored as an `Address` record, and buildings reference it via a foreign key.

## Database Design (Normalized Approach)

### Buildings Table - New Column

| Column Name | Type | Description |
|------------|------|-------------|
| `nearest_fire_station_id` | INTEGER (FK) | Foreign key to `addresses` table storing fire station location |

### Addresses Table - New Columns

| Column Name | Type | Description |
|------------|------|-------------|
| `address_type` | VARCHAR(50) | Type: BUILDING, FIRE_STATION, ORGANIZATION, OTHER |
| `fire_station_name` | VARCHAR(255) | Name of fire station (if type is FIRE_STATION) |
| `fire_station_distance_km` | DECIMAL(8,2) | Distance from source building in kilometers |

**Note**: Addresses table already has `location` field (PostGIS POINT) for coordinates.

## Why This Design?

### Normalized Structure Benefits:
1. **No Data Duplication**: Fire station stored once, referenced by multiple buildings
2. **Consistency**: Single source of truth for each fire station
3. **Reusability**: Same address record used by multiple buildings
4. **Standard Relations**: Uses existing address infrastructure
5. **Easy Updates**: Update fire station once, affects all buildings

### Example:
```
Building 1 ──┐
Building 2 ──┼──> Address (Fire Station "Sector 15") 
Building 3 ──┘     - lat: 28.7234
               - lon: 77.3401
               - name: "Sector 15 Fire Station"
```

## How It Works

### 1. Building Addresses
Each building already has an `address_id` pointing to its location in the `addresses` table. The address record contains a PostGIS `location` field with coordinates.

### 2. Hardcoded Coordinates (Demo)
For demonstration, the script uses hardcoded coordinates:
- **Latitude**: 28.726
- **Longitude**: 77.339
- **Search Radius**: 10km

### 3. Finding Nearest Fire Station

The script:
1. Uses hardcoded lat/lon to query OpenStreetMap Overpass API
2. Finds fire stations within 10km radius
3. Filters valid stations (must have name or address)
4. Calculates distance using Haversine formula
5. Selects the closest station
6. Creates/finds `Address` record with `address_type='FIRE_STATION'`
7. Updates building's `nearest_fire_station_id` to reference this address

### 4. Querying Data

To get building with nearest fire station:
```javascript
const building = await Building.findOne({
  where: { building_code: 'BLD-GGN-001' },
  include: [
    { model: Address, as: 'address' },
    { model: Address, as: 'nearestFireStation' }
  ]
});

console.log(building.nearestFireStation.fire_station_name);
console.log(building.nearestFireStation.fire_station_distance_km);
```

## Usage

### Update All Buildings

```bash
npm run update:fire-stations
```

This will:
- Find all active buildings
- Use hardcoded coordinates (28.726, 77.339)
- Query OpenStreetMap for fire stations
- Create/update address records for fire stations
- Link buildings to their nearest fire station
- Add 2-second delays between API requests

### Example Output

```
🚒 Starting Nearest Fire Station Update Process
============================================================
📍 Using hardcoded coordinates: 28.726, 77.339
🔍 Search radius: 10 km
============================================================

✅ Database connected

📊 Found 3 active building(s) to process

🏢 Processing: Cyber Heights Office Complex (BLD-GGN-001)
   📍 Using coordinates: 28.726, 77.339
   🔍 Searching for nearest fire station...
   ✅ Found: Sector 15 Fire Station
   📏 Distance: 2.34 km
   📮 Address: Sector 15, Gurugram, Haryana, 122001
   ✨ Created new fire station address (ID: 42)
   💾 Building updated successfully
   ⏳ Waiting 2 seconds before next request...

[... more buildings ...]

============================================================

📊 SUMMARY
✅ Successfully updated: 3 building(s)
```

### Query API Directly

```bash
GET /api/nearest-station?lat=28.726&lon=77.339
```

**Response:**
```json
{
  "input": {
    "latitude": 28.726,
    "longitude": 77.339
  },
  "nearestStation": {
    "name": "Sector 15 Fire Station",
    "latitude": 28.7234,
    "longitude": 77.3401,
    "distanceKm": 2.34,
    "address": "Sector 15, Gurugram, Haryana, 122001"
  }
}
```

## Setup Process

### Initial Setup

1. **Set up database schema:**
   ```bash
   npm run db:setup
   ```

2. **Seed demo buildings:**
   ```bash
   npm run seed:demo
   ```

3. **Update fire station data:**
   ```bash
   npm run update:fire-stations
   ```

### Database Schema

The script will automatically create these columns:
- `buildings.nearest_fire_station_id` (foreign key)
- `addresses.address_type` (enum)
- `addresses.fire_station_name` (varchar)
- `addresses.fire_station_distance_km` (decimal)

## Data Flow

```
┌──────────────────┐
│ Hardcoded Input  │
│ lat: 28.726      │
│ lon: 77.339      │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Overpass API     │
│ Find stations    │
│ within 10km      │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Calculate        │
│ Haversine        │
│ Distance         │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Create/Find      │
│ Address Record   │
│ (FIRE_STATION)   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Update Building  │
│ nearest_fire_    │
│ station_id = FK  │
└──────────────────┘
```

## Database Relationships

```sql
-- Buildings table
CREATE TABLE buildings (
  id SERIAL PRIMARY KEY,
  building_code VARCHAR(50),
  name VARCHAR(200),
  address_id INTEGER REFERENCES addresses(id),
  nearest_fire_station_id INTEGER REFERENCES addresses(id), -- NEW
  -- ... other columns
);

-- Addresses table
CREATE TABLE addresses (
  id SERIAL PRIMARY KEY,
  address_line_1 VARCHAR(255),
  city VARCHAR(100),
  location GEOGRAPHY(POINT, 4326),
  address_type VARCHAR(50),           -- NEW
  fire_station_name VARCHAR(255),     -- NEW
  fire_station_distance_km DECIMAL(8,2), -- NEW
  -- ... other columns
);
```

## Advantages of This Approach

### 1. Data Integrity
- Fire station exists as a proper address
- Can be referenced by multiple buildings
- Single source of truth

### 2. Query Efficiency
```javascript
// Get all buildings near "Sector 15 Fire Station"
const fireStation = await Address.findOne({
  where: { fire_station_name: 'Sector 15 Fire Station' }
});

const buildings = await Building.findAll({
  where: { nearest_fire_station_id: fireStation.id }
});
```

### 3. Reusability
- Multiple buildings can share same fire station
- Fire station updated once, applies to all
- Can query "which buildings use this fire station?"

### 4. Extensibility
- Easy to add more fire station metadata
- Can add multiple stations per building (top 3 nearest)
- Can create fire station management module

## Error Handling

The script handles:
- **No coordinates**: Uses hardcoded demo coordinates
- **No station found**: Logs warning, continues
- **API failure**: Catches and reports errors
- **Duplicate stations**: Reuses existing address records

## Technical Details

### Haversine Distance Formula
Calculates great-circle distance between two points:
- Earth radius: 6371 km
- Returns distance in kilometers (2 decimal places)

### PostGIS Integration
- Uses `ST_GeomFromText` to create geography points
- Format: `POINT(longitude latitude)`
- SRID: 4326 (WGS 84)

### API Rate Limiting
- 2-second delay between requests
- Respects OpenStreetMap usage policies
- Prevents API throttling

## Future Enhancements

- [ ] Auto-geocode building addresses to get real coordinates
- [ ] Store top 3 nearest fire stations
- [ ] Cache fire station data to reduce API calls
- [ ] Use routing APIs for road distance
- [ ] Scheduled updates (cron job)
- [ ] Fire station management dashboard
- [ ] Map visualization on frontend
- [ ] Alert when fire station changes

## Comparison: Old vs New Design

### Old Design (Denormalized)
```
buildings table:
- latitude
- longitude
- nearest_fire_station_name
- nearest_fire_station_address
- nearest_fire_station_latitude
- nearest_fire_station_longitude
- nearest_fire_station_distance_km
```
❌ Duplicates fire station data  
❌ Hard to update fire stations  
❌ Wastes storage space  

### New Design (Normalized)
```
buildings table:
- nearest_fire_station_id (FK to addresses)

addresses table:
- address_type = 'FIRE_STATION'
- fire_station_name
- fire_station_distance_km
- location (PostGIS POINT)
```
✅ No duplication  
✅ Single source of truth  
✅ Standard relationships  
✅ Easy to query and update  

## Summary

This implementation uses a **normalized database design** where:
1. Fire stations are stored as `Address` records with `address_type='FIRE_STATION'`
2. Buildings reference fire stations via `nearest_fire_station_id` foreign key
3. Hardcoded coordinates (28.726, 77.339) used for demo
4. Script creates/updates address records and links buildings
5. Standard SQL relationships make querying intuitive

**Ready to use!** Just run `npm run update:fire-stations`
