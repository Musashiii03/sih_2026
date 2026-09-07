/**
 * Sync Fire Incidents Utility
 * 
 * Scans the data/fire_incidents folder and syncs incidents to the database
 */

const fs = require('fs').promises;
const path = require('path');
const { Incident, IncidentDetection, Building, Camera, Evidence, sequelize } = require('../models');

/**
 * Sync all fire incidents from filesystem to database
 */
async function syncFireIncidents(dataPath = null) {
  const baseDataPath = dataPath || path.join(__dirname, '..', '..', 'data', 'fire_incidents');
  
  console.log('🔄 Starting fire incident sync...');
  console.log(`📂 Data path: ${baseDataPath}`);

  try {
    // Check if directory exists
    await fs.access(baseDataPath);
  } catch (error) {
    console.error('❌ Fire incidents directory not found:', baseDataPath);
    return { success: false, error: 'Directory not found' };
  }

  let syncedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  try {
    // Read all date directories
    const dateDirs = await fs.readdir(baseDataPath, { withFileTypes: true });

    for (const dateDir of dateDirs) {
      if (!dateDir.isDirectory()) continue;

      const datePath = path.join(baseDataPath, dateDir.name);
      
      // Read all incident directories in this date folder
      const incidentDirs = await fs.readdir(datePath, { withFileTypes: true });

      for (const incidentDir of incidentDirs) {
        if (!incidentDir.isDirectory()) continue;

        const incidentPath = path.join(datePath, incidentDir.name);
        const summaryPath = path.join(incidentPath, 'summary.json');

        try {
          // Check if summary.json exists
          await fs.access(summaryPath);

          // Read the summary file
          const summaryData = await fs.readFile(summaryPath, 'utf8');
          
          // Check if file is empty or has BOM
          if (!summaryData || summaryData.trim().length === 0) {
            console.warn(`⚠️  Empty summary file: ${summaryPath}`);
            errorCount++;
            continue;
          }
          
          // Remove BOM if present and parse
          const cleanData = summaryData.replace(/^\uFEFF/, '');
          const summary = JSON.parse(cleanData);

          // Check if incident already exists
          let existingIncident = null;
          try {
            existingIncident = await Incident.findOne({
              where: { incident_number: summary.incident_id }
            });
          } catch (dbError) {
            console.error(`❌ Database query error:`, dbError.message);
            throw dbError;
          }

          if (existingIncident) {
            console.log(`⏩ Skipping existing incident: ${summary.incident_id}`);
            skippedCount++;
            continue;
          }

          // Find camera by camera_id
          let cameraRecord = null;
          let buildingId = null;

          if (summary.camera_id) {
            cameraRecord = await Camera.findOne({
              where: { camera_code: summary.camera_id }
            });

            if (cameraRecord) {
              buildingId = cameraRecord.building_id;
            } else {
              console.warn(`⚠️  Camera not found: ${summary.camera_id}, using default building`);
              // Use first available building as fallback
              const defaultBuilding = await Building.findOne();
              buildingId = defaultBuilding?.id || null;
            }
          }

          // Determine severity based on statistics
          let severity = 'LOW';
          let priority = 'MEDIUM';

          if (summary.statistics) {
            const avgConfidence = summary.statistics.avg_fire_confidence || 0;
            const humanCount = summary.statistics.total_human_detections || 0;

            if (humanCount > 0 || avgConfidence > 0.7) {
              severity = 'CRITICAL';
              priority = 'URGENT';
            } else if (avgConfidence > 0.5) {
              severity = 'HIGH';
              priority = 'HIGH';
            } else if (avgConfidence > 0.3) {
              severity = 'MEDIUM';
              priority = 'MEDIUM';
            }
          }

          // Create incident with dashboard URL
          const dashboardUrl = `dispatch/${summary.incident_id}`;
          
          const incident = await Incident.create({
            incident_number: summary.incident_id,
            incident_type: 'FIRE',
            source_type: 'CCTV_AI',
            status: 'DETECTED',
            severity: severity,
            priority: priority,
            building_id: buildingId,
            building_unit_id: null,
            reported_by_user_id: null,
            detected_by_camera_id: cameraRecord ? cameraRecord.id : null,
            description: `AI-detected fire incident with ${summary.statistics?.total_fire_detections || 0} fire detections across ${summary.frame_count || 0} frames`,
            detected_at: summary.timestamp ? new Date(summary.timestamp * 1000) : new Date(summary.timestamp_readable),
            reported_at: new Date(summary.timestamp_readable),
            acknowledged_at: null,
            resolved_at: null,
            location: sequelize.fn('ST_GeomFromText', 'POINT(77.0266 28.4595)', 4326),
            confidence_score: summary.statistics?.avg_fire_confidence || 0,
            dashboard_url: dashboardUrl
          });

          // Create detection records for each frame
          if (summary.frames && Array.isArray(summary.frames)) {
            for (const frame of summary.frames) {
              await IncidentDetection.create({
                incident_id: incident.id,
                camera_id: cameraRecord ? cameraRecord.id : null,
                detection_type: 'FIRE',
                confidence_score: frame.fire_confidence || 0,
                detected_at: frame.timestamp ? new Date(frame.timestamp * 1000) : new Date(frame.timestamp_readable),
                floor_number: cameraRecord?.floor_number || null,
                room_name: cameraRecord?.room_name || null,
                bounding_box: null,
                frame_number: frame.frame_index,
                frame_index: frame.frame_index,
                fire_count: frame.fire_count || 0,
                human_count: frame.human_count || 0,
                object_count: frame.object_count || 0,
                image_path: frame.image_path,
                metadata_path: frame.metadata_path,
                model_name: 'YOLOv8-Fire-Detection',
                model_version: '1.0'
              });

              // Create evidence record for the frame image
              if (frame.image_path) {
                try {
                  const stats = await fs.stat(frame.image_path);
                  const fileName = path.basename(frame.image_path);

                  await Evidence.create({
                    incident_id: incident.id,
                    evidence_type: 'CCTV_FRAME',
                    file_name: fileName,
                    file_path: frame.image_path,
                    mime_type: 'image/jpeg',
                    file_size_bytes: stats.size,
                    captured_at: frame.timestamp ? new Date(frame.timestamp * 1000) : new Date(frame.timestamp_readable),
                    uploaded_at: new Date(),
                    source_type: 'AI',
                    camera_id: cameraRecord ? cameraRecord.id : null,
                    description: `Frame ${frame.frame_index} - Fire detected with ${frame.fire_count} fire instances`,
                    checksum: null
                  });
                } catch (error) {
                  console.warn(`⚠️  Could not create evidence for frame ${frame.frame_index}:`, error.message);
                }
              }
            }
          }

          console.log(`✅ Synced incident: ${summary.incident_id} with ${summary.frame_count} frames`);
          syncedCount++;

        } catch (error) {
          console.error(`❌ Error syncing incident ${incidentDir.name}:`, error.message);
          console.error(`   File: ${summaryPath}`);
          if (error.message.includes('JSON')) {
            console.error(`   This appears to be a JSON parsing error. Checking file...`);
            try {
              const content = await fs.readFile(summaryPath, 'utf8');
              console.error(`   File length: ${content.length} bytes`);
              console.error(`   First 100 chars: ${content.substring(0, 100)}`);
            } catch (readErr) {
              console.error(`   Could not read file for debugging: ${readErr.message}`);
            }
          }
          errorCount++;
        }
      }
    }

    console.log('\n📊 Sync Summary:');
    console.log(`   ✅ Synced: ${syncedCount}`);
    console.log(`   ⏩ Skipped: ${skippedCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);

    return {
      success: true,
      synced: syncedCount,
      skipped: skippedCount,
      errors: errorCount
    };

  } catch (error) {
    console.error('❌ Sync failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Command-line interface
 */
if (require.main === module) {
  (async () => {
    try {
      // Test database connection
      await sequelize.authenticate();
      console.log('✅ Database connected');

      // Run sync
      const result = await syncFireIncidents();

      if (result.success) {
        console.log('\n✅ Sync completed successfully');
        process.exit(0);
      } else {
        console.error('\n❌ Sync failed');
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Fatal error:', error);
      process.exit(1);
    }
  })();
}

module.exports = { syncFireIncidents };
