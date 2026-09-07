#!/usr/bin/env node

/**
 * Update Nearest Fire Stations Script
 * 
 * Fetches nearest fire station for each building and stores it as an address record.
 * Uses the existing addresses table and creates a foreign key relationship.
 * 
 * Hardcoded Input: lat 28.726, lon 77.339 (for demo purposes)
 */

const path = require('path');
const https = require('https');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { sequelize, Building, Address } = require('../src/models');

// ============================================================================
// HARDCODED COORDINATES FOR DEMO
// ============================================================================
const DEMO_LATITUDE = 28.726;
const DEMO_LONGITUDE = 77.339;
const SEARCH_RADIUS_METERS = 10000; // 10km

// ============================================================================
// HELPERS (from station.routes.js)
// ============================================================================

function getStationCoordinates(el) {
  if (el.type === 'node') {
    return { latitude: el.lat, longitude: el.lon };
  }
  if (el.center && el.center.lat !== undefined && el.center.lon !== undefined) {
    return { latitude: el.center.lat, longitude: el.center.lon };
  }
  return { latitude: undefined, longitude: undefined };
}

function isInvalidStation(el) {
  const tags = el.tags || {};
  if (tags.barrier === 'wall') return true;
  return false;
}

function hasIdentifyingInfo(el) {
  const tags = el.tags || {};
  if (tags.name && tags.name.trim() !== '') return true;
  const addressTags = ['addr:housenumber', 'addr:street', 'addr:suburb', 'addr:city', 'addr:state', 'addr:postcode'];
  return addressTags.some(tag => tags[tag] && tags[tag].trim() !== '');
}

function getStationAddress(el) {
  const tags = el.tags || {};
  const parts = [];
  const addressTags = [
    'addr:housenumber',
    'addr:street',
    'addr:suburb',
    'addr:city',
    'addr:state',
    'addr:postcode'
  ];
  for (const tag of addressTags) {
    if (tags[tag] && tags[tag].trim() !== '') {
      parts.push(tags[tag].trim());
    }
  }
  return parts.length > 0 ? parts.join(', ') : null;
}

function getStationName(el) {
  const tags = el.tags || {};
  if (tags.name && tags.name.trim() !== '') {
    return tags.name.trim();
  }
  const address = getStationAddress(el);
  if (address) {
    return `Fire Station — ${address}`;
  }
  return null;
}

function filterStations(elements) {
  return elements.filter(el => {
    if (isInvalidStation(el)) return false;
    if (!hasIdentifyingInfo(el)) return false;
    return true;
  });
}

function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + 
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

function fetchNearbyFireStations(lat, lon, radiusMeters = 10000) {
  return new Promise((resolve, reject) => {
    const query = `[out:json][timeout:25];(node["amenity"="fire_station"](around:${radiusMeters},${lat},${lon});way["amenity"="fire_station"](around:${radiusMeters},${lat},${lon});relation["amenity"="fire_station"](around:${radiusMeters},${lat},${lon}););out center;`;
    const urlString = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
    const parsedUrl = new URL(urlString);

    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'User-Agent': 'AtmarakshakSystem/2.4 (contact: alik9@gemini-antigravity-ide.com)',
        'Accept': 'application/json'
      },
      timeout: 15000
    };

    const req = https.request(options, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Overpass API responded with status code ${res.statusCode}`));
        return;
      }

      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (!parsed.elements) { resolve([]); return; }
          resolve(parsed.elements);
        } catch (e) {
          reject(new Error('Failed to parse Overpass API response: ' + e.message));
        }
      });
    });

    req.on('error', (err) => { reject(err); });
    req.on('timeout', () => { req.destroy(); reject(new Error('Overpass API request timed out')); });
    req.end();
  });
}

// ============================================================================
// MAIN LOGIC
// ============================================================================

/**
 * Extract lat/lon from PostGIS POINT
 */
function extractCoordinatesFromLocation(address) {
  if (!address || !address.location) return null;
  
  // PostGIS location is stored as a geography point
  // Sequelize returns it as an object with coordinates
  const loc = address.location;
  
  if (loc.coordinates && Array.isArray(loc.coordinates)) {
    // PostGIS format: POINT(longitude latitude)
    return {
      longitude: loc.coordinates[0],
      latitude: loc.coordinates[1]
    };
  }
  
  return null;
}

/**
 * Find nearest fire station using hardcoded coordinates
 */
async function findNearestFireStation(lat, lon, radiusMeters = 10000) {
  try {
    const rawElements = await fetchNearbyFireStations(lat, lon, radiusMeters);

    if (!rawElements || rawElements.length === 0) {
      return null;
    }

    const validStations = filterStations(rawElements);

    if (validStations.length === 0) {
      return null;
    }

    let closestStation = null;
    let minDistance = Infinity;

    for (const el of validStations) {
      const coords = getStationCoordinates(el);
      if (coords.latitude === undefined || coords.longitude === undefined) continue;

      const distance = calculateHaversineDistance(lat, lon, coords.latitude, coords.longitude);
      const name = getStationName(el);

      if (!name) continue;

      if (distance < minDistance) {
        minDistance = distance;
        const address = getStationAddress(el);
        closestStation = {
          name,
          latitude: coords.latitude,
          longitude: coords.longitude,
          distanceKm: distance,
          address
        };
      }
    }

    return closestStation;
  } catch (error) {
    console.error(`   ❌ Error fetching fire stations: ${error.message}`);
    return null;
  }
}

/**
 * Parse address components from fire station address string
 */
function parseFireStationAddress(addressString, stationName) {
  // Default values
  const parsed = {
    address_line_1: stationName || 'Fire Station',
    address_line_2: null,
    landmark: null,
    locality: 'Unknown',
    city: 'Unknown',
    district: 'Unknown',
    state: 'Unknown',
    country: 'India',
    postal_code: '000000'
  };

  if (!addressString) return parsed;

  // Try to parse the comma-separated address
  const parts = addressString.split(',').map(p => p.trim()).filter(p => p);
  
  if (parts.length >= 1) parsed.address_line_1 = parts[0];
  if (parts.length >= 2) parsed.locality = parts[1];
  if (parts.length >= 3) parsed.city = parts[2];
  if (parts.length >= 4) parsed.state = parts[3];
  if (parts.length >= 5) parsed.postal_code = parts[4];

  // If we have a district in city or state, use it
  parsed.district = parsed.city;

  return parsed;
}

/**
 * Create or find fire station address record
 */
async function createOrFindFireStationAddress(stationData) {
  const { name, latitude, longitude, address } = stationData;

  // Check if this fire station already exists in addresses
  const existingAddress = await Address.findOne({
    where: {
      address_type: 'FIRE_STATION',
      fire_station_name: name
    }
  });

  if (existingAddress) {
    console.log(`   ♻️  Fire station address already exists (ID: ${existingAddress.id})`);
    return existingAddress;
  }

  // Parse address components
  const addressComponents = parseFireStationAddress(address, name);

  // Create new address record for fire station
  const newAddress = await Address.create({
    address_line_1: addressComponents.address_line_1,
    address_line_2: addressComponents.address_line_2,
    landmark: addressComponents.landmark,
    locality: addressComponents.locality,
    city: addressComponents.city,
    district: addressComponents.district,
    state: addressComponents.state,
    country: addressComponents.country,
    postal_code: addressComponents.postal_code,
    location: sequelize.fn('ST_GeomFromText', `POINT(${longitude} ${latitude})`, 4326),
    address_type: 'FIRE_STATION',
    fire_station_name: name
  });

  console.log(`   ✨ Created new fire station address (ID: ${newAddress.id})`);
  return newAddress;
}

/**
 * Update a single building with nearest fire station
 */
async function updateBuildingFireStation(building) {
  console.log(`\n🏢 Processing: ${building.name} (${building.building_code})`);
  
  // Get building address to extract coordinates
  const buildingAddress = await Address.findByPk(building.address_id);
  
  if (!buildingAddress || !buildingAddress.location) {
    console.log('   ⚠️  Building has no address or location, using hardcoded coordinates');
  }

  // Use hardcoded coordinates for demo
  const lat = DEMO_LATITUDE;
  const lon = DEMO_LONGITUDE;

  console.log(`   📍 Using coordinates: ${lat}, ${lon}`);
  console.log('   🔍 Searching for nearest fire station...');

  const nearestStation = await findNearestFireStation(lat, lon, SEARCH_RADIUS_METERS);

  if (!nearestStation) {
    console.log('   ⚠️  No fire station found within search radius');
    return { success: false, reason: 'no_station_found' };
  }

  console.log(`   ✅ Found: ${nearestStation.name}`);
  console.log(`   📏 Distance: ${nearestStation.distanceKm} km`);
  if (nearestStation.address) {
    console.log(`   📮 Address: ${nearestStation.address}`);
  }

  // Create or find fire station address
  const fireStationAddress = await createOrFindFireStationAddress(nearestStation);

  // Update building with fire station reference AND distance
  await building.update({
    nearest_fire_station_id: fireStationAddress.id,
    fire_station_distance_km: nearestStation.distanceKm
  });

  console.log('   💾 Building updated successfully');
  return { success: true, station: nearestStation, addressId: fireStationAddress.id };
}

/**
 * Main function
 */
async function updateAllBuildingsFireStations() {
  console.log('\n🚒 Starting Nearest Fire Station Update Process\n');
  console.log('=' .repeat(60));
  console.log(`📍 Using hardcoded coordinates: ${DEMO_LATITUDE}, ${DEMO_LONGITUDE}`);
  console.log(`🔍 Search radius: ${SEARCH_RADIUS_METERS / 1000} km`);
  console.log('=' .repeat(60));

  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('\n✅ Database connected\n');

    // Fetch all active buildings
    const buildings = await Building.findAll({
      where: {
        status: 'ACTIVE'
      },
      order: [['building_code', 'ASC']]
    });

    if (buildings.length === 0) {
      console.log('⚠️  No active buildings found in database');
      return;
    }

    console.log(`📊 Found ${buildings.length} active building(s) to process\n`);

    let successCount = 0;
    let noStationCount = 0;
    let errorCount = 0;

    // Process each building
    for (let i = 0; i < buildings.length; i++) {
      const building = buildings[i];
      
      try {
        const result = await updateBuildingFireStation(building);
        
        if (result.success) {
          successCount++;
        } else if (result.reason === 'no_station_found') {
          noStationCount++;
        }

        // Add delay between requests to avoid overwhelming Overpass API
        if (i < buildings.length - 1) {
          console.log('   ⏳ Waiting 2 seconds before next request...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

      } catch (error) {
        console.error(`   ❌ Error processing building: ${error.message}`);
        errorCount++;
      }
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 SUMMARY\n');
    console.log(`✅ Successfully updated: ${successCount} building(s)`);
    if (noStationCount > 0) {
      console.log(`⚠️  No station found: ${noStationCount} building(s)`);
    }
    if (errorCount > 0) {
      console.log(`❌ Errors: ${errorCount} building(s)`);
    }
    console.log('');

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('👋 Database connection closed\n');
  }
}

// Run the script
updateAllBuildingsFireStations();