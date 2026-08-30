const http = require('http');

const tests = [
  { lat: 28.72575, lon: 77.33565, label: 'Original coordinates' },
  { lat: 28.6139, lon: 77.2090, label: 'Connaught Place' }
];

let done = 0;
tests.forEach((t, i) => {
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: `/api/nearest-station?lat=${t.lat}&lon=${t.lon}`,
    method: 'GET'
  };
  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => {
      console.log(`\n--- Test ${i+1}: ${t.label} ---`);
      console.log(data);
      const parsed = JSON.parse(data);
      const s = parsed.nearestStation;
      console.log(`  Input: ${parsed.input.latitude}, ${parsed.input.longitude}`);
      console.log(`  Station: ${s?.name}`);
      console.log(`  Coords: ${s?.latitude}, ${s?.longitude}`);
      console.log(`  Distance: ${s?.distanceKm} km`);
      console.log(`  Has Unnamed: ${JSON.stringify(parsed).includes('Unnamed Fire Station')}`);
      console.log(`  Has barrier: ${JSON.stringify(parsed).includes('barrier')}`);
      done++;
      if (done === tests.length) process.exit(0);
    });
  });
  req.end();
});
