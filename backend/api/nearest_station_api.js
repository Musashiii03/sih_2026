const express = require('express');
const https = require('https');

const router = express.Router();

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Extracts coordinates from an OSM element.
 * Nodes use lat/lon directly. Ways/relations use center.lat/center.lon.
 */
function getStationCoordinates(el) {
  if (el.type === 'node') {
    return { latitude: el.lat, longitude: el.lon };
  }
  if (el.center && el.center.lat !== undefined && el.center.lon !== undefined) {
    return { latitude: el.center.lat, longitude: el.center.lon };
  }
  return { latitude: undefined, longitude: undefined };
}

/**
 * Checks whether an OSM element has obviously conflicting tags
 * that indicate it is NOT a real fire station.
 */
function isInvalidStation(el) {
  const tags = el.tags || {};
  if (tags.barrier === 'wall') return true;
  return false;
}

/**
 * Checks whether an OSM element has any identifying information:
 * a name tag or at least one usable address tag.
 */
function hasIdentifyingInfo(el) {
  const tags = el.tags || {};
  if (tags.name && tags.name.trim() !== '') return true;
  const addressTags = ['addr:housenumber', 'addr:street', 'addr:suburb', 'addr:city', 'addr:state', 'addr:postcode'];
  return addressTags.some(tag => tags[tag] && tags[tag].trim() !== '');
}

/**
 * Constructs a readable address string from available OSM address tags.
 * Only includes tags that actually have values.
 */
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

/**
 * Returns the best identifying label for a station:
 * 1. Prefer name if available.
 * 2. Otherwise construct a label from address tags.
 * 3. Should never return "Unnamed Fire Station".
 */
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

/**
 * Filters out invalid or unidentifiable fire-station candidates.
 * - Excludes elements with conflicting tags (e.g. barrier=wall)
 * - Excludes elements with no name AND no address info
 */
function filterStations(elements) {
  return elements.filter(el => {
    if (isInvalidStation(el)) return false;
    if (!hasIdentifyingInfo(el)) return false;
    return true;
  });
}

/**
 * Queries the Overpass API to find fire stations within a given radius (in meters)
 * around the specified latitude and longitude.
 *
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {number} radiusMeters - Radius in meters
 * @returns {Promise<Array>} List of raw OSM fire-station elements
 */
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

/**
 * Calculates the straight-line geographic distance between two coordinates
 * using the Haversine formula.
 */
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

// ============================================================================
// API ROUTE
// ============================================================================

/**
 * GET /api/nearest-station
 *
 * Returns the nearest identifiable fire station using OSM Overpass API and Haversine formula.
 * Query parameters:
 *   - lat: latitude (default: 28.72575)
 *   - lon: longitude (default: 77.33565)
 *   - radius: search radius in meters (default: 10000)
 */
router.get('/nearest-station', async (req, res) => {
  const inputLat = parseFloat(req.query.lat) || 28.72575;
  const inputLon = parseFloat(req.query.lon) || 77.33565;
  const searchRadiusMeters = parseInt(req.query.radius, 10) || 10000;

  try {
    const rawElements = await fetchNearbyFireStations(inputLat, inputLon, searchRadiusMeters);

    if (!rawElements || rawElements.length === 0) {
      return res.status(404).json({
        error: 'NotFound',
        message: `No fire stations found within ${searchRadiusMeters / 1000} km of the given location`,
        input: { latitude: inputLat, longitude: inputLon }
      });
    }

    const validStations = filterStations(rawElements);

    if (validStations.length === 0) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'No identifiable fire stations found within the search radius',
        input: { latitude: inputLat, longitude: inputLon }
      });
    }

    let closestStation = null;
    let minDistance = Infinity;

    for (const el of validStations) {
      const coords = getStationCoordinates(el);
      if (coords.latitude === undefined || coords.longitude === undefined) continue;

      const distance = calculateHaversineDistance(inputLat, inputLon, coords.latitude, coords.longitude);
      const name = getStationName(el);

      if (!name) continue;

      if (distance < minDistance) {
        minDistance = distance;
        const address = getStationAddress(el);
        const stationObj = {
          name,
          latitude: coords.latitude,
          longitude: coords.longitude,
          distanceKm: distance
        };
        if (address) stationObj.address = address;
        closestStation = stationObj;
      }
    }

    if (!closestStation) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'No identifiable fire stations found within the search radius',
        input: { latitude: inputLat, longitude: inputLon }
      });
    }

    res.json({
      input: { latitude: inputLat, longitude: inputLon },
      nearestStation: closestStation
    });

  } catch (error) {
    console.error('❌ Error in /api/nearest-station:', error.message);
    res.status(502).json({
      error: 'BadGateway',
      message: 'Failed to retrieve fire stations from geographic data service',
      details: error.message
    });
  }
});

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = router;