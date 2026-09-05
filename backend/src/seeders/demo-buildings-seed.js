/**
 * Demo Buildings and Cameras Seed
 * 
 * Creates sample buildings with cameras for testing fire incident detection
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const now = new Date();

    // Check if buildings already exist
    const existingBuildings = await queryInterface.sequelize.query(
      `SELECT building_code FROM buildings WHERE building_code IN ('BLD-GGN-001', 'BLD-GGN-002', 'BLD-GGN-003')`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (existingBuildings.length > 0) {
      console.log('⏩ Demo buildings already exist, skipping seed');
      return;
    }

    // Create addresses for buildings
    const addresses = [
      {
        address_line_1: 'Plot No. 123, Sector 15',
        address_line_2: 'Near City Mall',
        landmark: 'Opposite Central Park',
        locality: 'Cyber City',
        city: 'Gurugram',
        district: 'Gurugram',
        state: 'Haryana',
        country: 'India',
        postal_code: '122001',
        location: Sequelize.fn('ST_GeomFromText', 'POINT(77.0266 28.4595)', 4326),
        created_at: now,
        updated_at: now
      },
      {
        address_line_1: 'Tower A, IT Park Complex',
        address_line_2: 'Phase 2',
        landmark: 'Behind Tech Hub',
        locality: 'DLF Cyber Hub',
        city: 'Gurugram',
        district: 'Gurugram',
        state: 'Haryana',
        country: 'India',
        postal_code: '122002',
        location: Sequelize.fn('ST_GeomFromText', 'POINT(77.0888 28.4950)', 4326),
        created_at: now,
        updated_at: now
      },
      {
        address_line_1: 'Block B, Green Valley Apartments',
        address_line_2: 'Sohna Road',
        landmark: 'Near Metro Station',
        locality: 'South City',
        city: 'Gurugram',
        district: 'Gurugram',
        state: 'Haryana',
        country: 'India',
        postal_code: '122018',
        location: Sequelize.fn('ST_GeomFromText', 'POINT(77.0419 28.4289)', 4326),
        created_at: now,
        updated_at: now
      }
    ];

    await queryInterface.bulkInsert('addresses', addresses);

    // Get the inserted address IDs
    const insertedAddresses = await queryInterface.sequelize.query(
      `SELECT id, postal_code FROM addresses WHERE postal_code IN ('122001', '122002', '122018') ORDER BY postal_code`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Create demo buildings
    const buildings = [
      {
        building_code: 'BLD-GGN-001',
        name: 'Cyber Heights Office Complex',
        building_type: 'OFFICE',
        address_id: insertedAddresses[0].id,
        number_of_floors: 12,
        number_of_units: 48,
        construction_year: 2018,
        total_area: 15000.00,
        height: 45.50,
        occupancy_type: 'COMMERCIAL',
        has_fire_alarm: true,
        has_sprinkler: true,
        has_fire_extinguishers: true,
        has_fire_exit: true,
        has_fire_hydrant: true,
        status: 'ACTIVE',
        created_at: now,
        updated_at: now
      },
      {
        building_code: 'BLD-GGN-002',
        name: 'Tech Tower Business Center',
        building_type: 'OFFICE',
        address_id: insertedAddresses[1].id,
        number_of_floors: 18,
        number_of_units: 72,
        construction_year: 2020,
        total_area: 22500.00,
        height: 68.00,
        occupancy_type: 'COMMERCIAL',
        has_fire_alarm: true,
        has_sprinkler: true,
        has_fire_extinguishers: true,
        has_fire_exit: true,
        has_fire_hydrant: true,
        status: 'ACTIVE',
        created_at: now,
        updated_at: now
      },
      {
        building_code: 'BLD-GGN-003',
        name: 'Green Valley Residency',
        building_type: 'APARTMENT',
        address_id: insertedAddresses[2].id,
        number_of_floors: 25,
        number_of_units: 200,
        construction_year: 2019,
        total_area: 35000.00,
        height: 85.00,
        occupancy_type: 'RESIDENTIAL',
        has_fire_alarm: true,
        has_sprinkler: true,
        has_fire_extinguishers: true,
        has_fire_exit: true,
        has_fire_hydrant: true,
        status: 'ACTIVE',
        created_at: now,
        updated_at: now
      }
    ];

    await queryInterface.bulkInsert('buildings', buildings);

    // Get the inserted building IDs
    const insertedBuildings = await queryInterface.sequelize.query(
      `SELECT id, building_code FROM buildings WHERE building_code IN ('BLD-GGN-001', 'BLD-GGN-002', 'BLD-GGN-003') ORDER BY building_code`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Create cameras for buildings
    const cameras = [
      // Cameras for Building 1
      {
        building_id: insertedBuildings[0].id,
        building_unit_id: null,
        camera_code: 'CAM-01',
        name: 'Lobby Main Entrance',
        manufacturer: 'Hikvision',
        model: 'DS-2CD2385G1-I',
        serial_number: 'HK2385G1001',
        camera_type: 'DOME',
        floor_number: 0,
        room_name: 'Main Lobby',
        location_description: 'Covering main entrance and reception area',
        direction: 'North-facing entrance',
        status: 'ONLINE',
        installed_at: new Date('2023-01-15'),
        last_seen_at: now,
        created_at: now,
        updated_at: now
      },
      {
        building_id: insertedBuildings[0].id,
        building_unit_id: null,
        camera_code: 'CAM-02',
        name: 'Floor 5 Corridor',
        manufacturer: 'Hikvision',
        model: 'DS-2CD2385G1-I',
        serial_number: 'HK2385G1002',
        camera_type: 'BULLET',
        floor_number: 5,
        room_name: 'Main Corridor',
        location_description: 'Monitoring hallway and emergency exits',
        direction: 'East-facing corridor',
        status: 'ONLINE',
        installed_at: new Date('2023-01-15'),
        last_seen_at: now,
        created_at: now,
        updated_at: now
      },
      {
        building_id: insertedBuildings[0].id,
        building_unit_id: null,
        camera_code: 'CAM-03',
        name: 'Parking Level B1',
        manufacturer: 'Dahua',
        model: 'IPC-HFW5831E-ZE',
        serial_number: 'DH5831E001',
        camera_type: 'BULLET',
        floor_number: -1,
        room_name: 'Basement Parking',
        location_description: 'Monitoring basement parking area',
        direction: 'Wide angle coverage',
        status: 'ONLINE',
        installed_at: new Date('2023-01-15'),
        last_seen_at: now,
        created_at: now,
        updated_at: now
      },
      // Cameras for Building 2
      {
        building_id: insertedBuildings[1].id,
        building_unit_id: null,
        camera_code: 'CAM-04',
        name: 'Reception Area',
        manufacturer: 'Hikvision',
        model: 'DS-2CD2385G1-I',
        serial_number: 'HK2385G1003',
        camera_type: 'PTZ',
        floor_number: 0,
        room_name: 'Reception',
        location_description: 'Main reception desk coverage',
        direction: '360-degree coverage',
        status: 'ONLINE',
        installed_at: new Date('2023-03-10'),
        last_seen_at: now,
        created_at: now,
        updated_at: now
      },
      {
        building_id: insertedBuildings[1].id,
        building_unit_id: null,
        camera_code: 'CAM-05',
        name: 'Server Room Floor 10',
        manufacturer: 'Axis',
        model: 'M3045-V',
        serial_number: 'AX3045V001',
        camera_type: 'DOME',
        floor_number: 10,
        room_name: 'Server Room',
        location_description: 'Critical server infrastructure monitoring',
        direction: 'Overview of server racks',
        status: 'ONLINE',
        installed_at: new Date('2023-03-10'),
        last_seen_at: now,
        created_at: now,
        updated_at: now
      },
      // Cameras for Building 3
      {
        building_id: insertedBuildings[2].id,
        building_unit_id: null,
        camera_code: 'CAM-06',
        name: 'Building Entrance',
        manufacturer: 'Hikvision',
        model: 'DS-2CD2385G1-I',
        serial_number: 'HK2385G1004',
        camera_type: 'DOME',
        floor_number: 0,
        room_name: 'Main Gate',
        location_description: 'Residential building main entrance',
        direction: 'Front entrance',
        status: 'ONLINE',
        installed_at: new Date('2023-02-20'),
        last_seen_at: now,
        created_at: now,
        updated_at: now
      },
      {
        building_id: insertedBuildings[2].id,
        building_unit_id: null,
        camera_code: 'CAM-07',
        name: 'Floor 15 Common Area',
        manufacturer: 'Dahua',
        model: 'IPC-HFW5831E-ZE',
        serial_number: 'DH5831E002',
        camera_type: 'BULLET',
        floor_number: 15,
        room_name: 'Common Area',
        location_description: 'Common area and lift lobby',
        direction: 'Lift and corridor',
        status: 'ONLINE',
        installed_at: new Date('2023-02-20'),
        last_seen_at: now,
        created_at: now,
        updated_at: now
      }
    ];

    await queryInterface.bulkInsert('cameras', cameras);

    console.log('✅ Demo buildings and cameras seeded successfully');
  },

  down: async (queryInterface, Sequelize) => {
    // Delete in reverse order due to foreign key constraints
    await queryInterface.bulkDelete('cameras', null, {});
    await queryInterface.bulkDelete('buildings', null, {});
    await queryInterface.bulkDelete('addresses', null, {});
    
    console.log('✅ Demo buildings and cameras removed');
  }
};
