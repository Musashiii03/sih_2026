# Fire Detection & Emergency Response --- Database Architecture

**Database:** PostgreSQL + PostGIS\
**Scope:** Initial production schema only

## 1. Core Tables

### users

People who access or operate the platform.

  Attribute       Data Type      Key / Notes
  --------------- -------------- -------------
  id              UUID           PK
  first_name      VARCHAR(100)   
  last_name       VARCHAR(100)   
  email           VARCHAR(255)   UNIQUE
  phone           VARCHAR(20)    UNIQUE
  password_hash   TEXT           
  status          VARCHAR(30)    
  created_at      TIMESTAMPTZ    
  updated_at      TIMESTAMPTZ    

### Possible `status` values

```text
ACTIVE
INACTIVE
SUSPENDED
PENDING
```

### addresses

Reusable physical address and geographic information.

  Attribute        Data Type               Key / Notes
  ---------------- ----------------------- -------------
  id               UUID                    PK
  address_line_1   VARCHAR(255)            
  address_line_2   VARCHAR(255)            NULL
  landmark         VARCHAR(255)            NULL
  locality         VARCHAR(150)            
  city             VARCHAR(100)            
  district         VARCHAR(100)            
  state            VARCHAR(100)            
  country          VARCHAR(100)            
  postal_code      VARCHAR(20)             
  location         GEOGRAPHY(POINT,4326)   PostGIS
  created_at       TIMESTAMPTZ             
  updated_at       TIMESTAMPTZ             

### buildings

Stores registered buildings monitored by the system.

  Attribute                Data Type       Key / Notes
  ------------------------ --------------- ----------------
  id                       UUID            PK
  building_code            VARCHAR(50)     UNIQUE
  name                     VARCHAR(200)    
  building_type            VARCHAR(50)     
  address_id               UUID            FK → addresses
  number_of_floors         INTEGER         
  number_of_units          INTEGER         
  construction_year        SMALLINT        NULL
  total_area               NUMERIC(12,2)   NULL
  height                   NUMERIC(8,2)    NULL
  occupancy_type           VARCHAR(30)     
  has_fire_alarm           BOOLEAN         
  has_sprinkler            BOOLEAN         
  has_fire_extinguishers   BOOLEAN         
  has_fire_exit            BOOLEAN         
  has_fire_hydrant         BOOLEAN         
  status                   VARCHAR(30)     
  created_at               TIMESTAMPTZ     
  updated_at               TIMESTAMPTZ

### Possible `building_type` values

```text
RESIDENTIAL
APARTMENT
OFFICE
MALL
HOTEL
HOSPITAL
SCHOOL
WAREHOUSE
FACTORY
GOVERNMENT
OTHER
```

### Possible `occupancy_type` values

```text
RESIDENTIAL
COMMERCIAL
INDUSTRIAL
MIXED
```

### Possible `status` values

```text
ACTIVE
INACTIVE
UNDER_CONSTRUCTION
DEMOLISHED
```

### owners

Represents an individual user or organization that owns a building.

  Attribute         Data Type     Key / Notes
  ----------------- ------------- ---------------------------
  id                UUID          PK
  owner_type        VARCHAR(30)   INDIVIDUAL / ORGANIZATION
  user_id           UUID          FK → users, NULL
  organization_id   UUID          FK → organizations, NULL
  created_at        TIMESTAMPTZ   
  updated_at        TIMESTAMPTZ

### Possible `owner_type` values

```text
INDIVIDUAL
ORGANIZATION
```

### building_units

Represents apartments, rooms, offices, shops, classrooms, etc.

  Attribute            Data Type       Key / Notes
  -------------------- --------------- ----------------
  id                   UUID            PK
  building_id          UUID            FK → buildings
  unit_number          VARCHAR(50)     
  floor_number         INTEGER         
  unit_type            VARCHAR(50)     
  area                 NUMERIC(10,2)   NULL
  occupancy_capacity   INTEGER         NULL
  status               VARCHAR(30)     
  created_at           TIMESTAMPTZ     
  updated_at           TIMESTAMPTZ

### Possible `unit_type` values

```text
APARTMENT
OFFICE
SHOP
ROOM
WAREHOUSE
CLASSROOM
```

### Possible `status` values

```text
OCCUPIED
VACANT
UNDER_MAINTENANCE
INACTIVE
```

### cameras

CCTV cameras installed in a building or specific unit.

  Attribute              Data Type      Key / Notes
  ---------------------- -------------- ---------------------------
  id                     UUID           PK
  building_id            UUID           FK → buildings
  building_unit_id       UUID           FK → building_units, NULL
  camera_code            VARCHAR(50)    UNIQUE
  name                   VARCHAR(150)   
  manufacturer           VARCHAR(100)   NULL
  model                  VARCHAR(100)   NULL
  serial_number          VARCHAR(100)   NULL
  camera_type            VARCHAR(50)    
  floor_number           INTEGER        NULL
  room_name              VARCHAR(100)   NULL
  location_description   VARCHAR(255)   NULL
  direction              VARCHAR(100)   NULL
  status                 VARCHAR(30)    
  installed_at           TIMESTAMPTZ    NULL
  last_seen_at           TIMESTAMPTZ    NULL
  created_at             TIMESTAMPTZ    
  updated_at             TIMESTAMPTZ

### Possible `camera_type` values

```text
FIXED
PTZ
THERMAL
DOME
BULLET
```

### Possible `status` values

```text
ONLINE
OFFLINE
MAINTENANCE
INACTIVE
```

### incidents

Central record for every detected or reported fire-related incident.

  Attribute               Data Type               Key / Notes
  ----------------------- ----------------------- ---------------------------
  id                      UUID                    PK
  incident_number         VARCHAR(30)             UNIQUE
  incident_type           VARCHAR(40)             
  source_type             VARCHAR(40)             
  status                  VARCHAR(40)             
  severity                VARCHAR(20)             
  priority                VARCHAR(20)             
  building_id             UUID                    FK → buildings, NULL
  building_unit_id        UUID                    FK → building_units, NULL
  reported_by_user_id     UUID                    FK → users, NULL
  detected_by_camera_id   UUID                    FK → cameras, NULL
  description             TEXT                    NULL
  detected_at             TIMESTAMPTZ             
  reported_at             TIMESTAMPTZ             NULL
  acknowledged_at         TIMESTAMPTZ             NULL
  resolved_at             TIMESTAMPTZ             NULL
  location                GEOGRAPHY(POINT,4326)   
  confidence_score        NUMERIC(5,4)            NULL
  created_at              TIMESTAMPTZ             
  updated_at              TIMESTAMPTZ

### Possible `incident_type` values

```text
FIRE
SMOKE
FALSE_ALARM
FIRE_HAZARD
OTHER
```

### Possible `source_type` values

```text
CCTV_AI
CITIZEN
SECURITY_GUARD
FIRE_DEPARTMENT
MANUAL
SENSOR
```

### Possible `status` values

```text
DETECTED
REPORTED
VERIFIED
DISPATCHED
RESPONDING
ON_SCENE
CONTAINED
RESOLVED
FALSE_ALARM
CLOSED
```

### Possible `severity` values

```text
LOW
MEDIUM
HIGH
CRITICAL
```

### Possible `priority` values

```text
LOW
MEDIUM
HIGH
URGENT
```

### incident_detections

Stores individual AI detections associated with an incident.

  Attribute          Data Type      Key / Notes
  ------------------ -------------- ---------------------------------
  id                 UUID           PK
  incident_id        UUID           FK → incidents
  camera_id          UUID           FK → cameras
  detection_type     VARCHAR(30)    FIRE / SMOKE / PERSON / VEHICLE
  confidence_score   NUMERIC(5,4)   
  detected_at        TIMESTAMPTZ    
  floor_number       INTEGER        NULL
  room_name          VARCHAR(100)   NULL
  bounding_box       JSONB          NULL
  frame_number       INTEGER        NULL
  model_name         VARCHAR(100)   NULL
  model_version      VARCHAR(50)    NULL
  created_at         TIMESTAMPTZ

### Possible `detection_type` values

```text
FIRE
SMOKE
PERSON
VEHICLE
```

### incident_people

Stores estimated people detected during an incident without requiring
identity.

  Attribute           Data Type      Key / Notes
  ------------------- -------------- --------------------------------
  id                  UUID           PK
  incident_id         UUID           FK → incidents
  detection_id        UUID           FK → incident_detections, NULL
  floor_number        INTEGER        NULL
  room_name           VARCHAR(100)   NULL
  estimated_count     INTEGER        
  status              VARCHAR(30)    
  confidence_score    NUMERIC(5,4)   NULL
  first_detected_at   TIMESTAMPTZ    
  last_detected_at    TIMESTAMPTZ    
  created_at          TIMESTAMPTZ    
  updated_at          TIMESTAMPTZ

### Possible `status` values

```text
DETECTED
POSSIBLY_TRAPPED
EVACUATED
RESCUED
UNKNOWN
```

### evidence

Metadata for incident images, videos, reports, floor plans, and 3D
files.

  Attribute         Data Type      Key / Notes
  ----------------- -------------- ----------------------------------
  id                UUID           PK
  incident_id       UUID           FK → incidents
  evidence_type     VARCHAR(30)    
  file_name         VARCHAR(255)   
  file_path         TEXT           Local storage path / storage key
  mime_type         VARCHAR(100)   
  file_size_bytes   BIGINT         
  captured_at       TIMESTAMPTZ    NULL
  uploaded_at       TIMESTAMPTZ    
  source_type       VARCHAR(30)    
  camera_id         UUID           FK → cameras, NULL
  description       TEXT           NULL
  checksum          VARCHAR(128)   NULL
  created_at        TIMESTAMPTZ

### Possible `evidence_type` values

```text
IMAGE
VIDEO
CCTV_FRAME
3D_MODEL
FLOOR_PLAN
DOCUMENT
AI_REPORT
```

### Possible `source_type` values

```text
CAMERA
AI
USER
SYSTEM
```

### incident_timeline

Chronological history of important incident events.

  -----------------------------------------------------------------------
  Attribute               Data Type               Key / Notes
  ----------------------- ----------------------- -----------------------
  id                      UUID                    PK

  incident_id             UUID                    FK → incidents

  event_type              VARCHAR(50)             

  description             TEXT                    

  actor_type              VARCHAR(30)             SYSTEM / AI / USER /
                                                  DISPATCHER / RESPONDER

  actor_user_id           UUID                    FK → users, NULL

  metadata                JSONB                   NULL

  occurred_at             TIMESTAMPTZ             

  created_at              TIMESTAMPTZ             
  -----------------------------------------------------------------------

### Possible `event_type` values

```text
INCIDENT_CREATED
FIRE_DETECTED
SMOKE_DETECTED
PERSON_DETECTED
EVIDENCE_ADDED
LOCATION_UPDATED
STATION_IDENTIFIED
NOTIFICATION_SENT
NOTIFICATION_FAILED
DISPATCH_CREATED
DISPATCH_ACKNOWLEDGED
UNIT_DISPATCHED
UNIT_ARRIVED
INCIDENT_RESOLVED
```

### Possible `actor_type` values

```text
SYSTEM
AI
USER
DISPATCHER
RESPONDER
```


### notifications

Records emergency notifications sent through configured channels.

  Attribute              Data Type      Key / Notes
  ---------------------- -------------- --------------------------
  id                     UUID           PK
  incident_id            UUID           FK → incidents, NULL
  notification_type      VARCHAR(40)    
  channel                VARCHAR(30)    
  recipient_user_id      UUID           FK → users, NULL
  recipient_station_id   UUID           FK → fire_stations, NULL
  recipient_address      VARCHAR(255)   NULL
  subject                VARCHAR(255)   NULL
  message                TEXT           
  priority               VARCHAR(20)    
  status                 VARCHAR(30)    
  created_at             TIMESTAMPTZ    
  scheduled_at           TIMESTAMPTZ    NULL
  sent_at                TIMESTAMPTZ    NULL

### Possible `notification_type` values

```text
INCIDENT_ALERT
DISPATCH_ALERT
STATUS_UPDATE
SYSTEM_ALERT
```

### Possible `channel` values

```text
VOICE
SMS
EMAIL
PUSH
WEBHOOK
```

### Possible `status` values

```text
PENDING
SENT
DELIVERED
FAILED
CANCELLED
```

### Possible `priority` values

```text
LOW
MEDIUM
HIGH
URGENT
```

### audit_logs

Records security-sensitive changes made through the application.

  Attribute       Data Type     Key / Notes
  --------------- ------------- ------------------
  id              UUID          PK
  actor_user_id   UUID          FK → users, NULL
  action          VARCHAR(50)   
  entity_type     VARCHAR(50)   
  entity_id       UUID          
  old_values      JSONB         NULL
  new_values      JSONB         NULL
  ip_address      INET          NULL
  user_agent      TEXT          NULL
  created_at      TIMESTAMPTZ   

## 2. Relationship Tables

### user_roles

Many-to-many relationship between users and roles.

  Attribute    Data Type     Key / Notes
  ------------ ------------- ----------------
  user_id      UUID          PK, FK → users
  role_id      UUID          PK, FK → roles
  created_at   TIMESTAMPTZ   

### ownerships

Many-to-many relationship between buildings and owners, including
ownership history.

  Attribute              Data Type      Key / Notes
  ---------------------- -------------- ----------------
  id                     UUID           PK
  building_id            UUID           FK → buildings
  owner_id               UUID           FK → owners
  ownership_type         VARCHAR(30)    
  ownership_percentage   NUMERIC(5,2)   NULL
  start_date             DATE           
  end_date               DATE           NULL
  is_primary             BOOLEAN        
  created_at             TIMESTAMPTZ    
  updated_at             TIMESTAMPTZ

### Possible `ownership_type` values

```text
FULL
PARTIAL
JOINT
```

### `emergency_contacts`

Stores authorized emergency communication endpoints for organizations or fire stations.

| Attribute | Data Type | Key / Notes |
|---|---|---|
| id | UUID | PK |
| organization_id | UUID | FK → organizations |
| station_id | UUID | FK → fire_stations, NULL |
| contact_type | VARCHAR(40) | |
| channel | VARCHAR(30) | |
| name | VARCHAR(150) | |
| endpoint | VARCHAR(500) | Phone, email, URL, etc. |
| is_authorized | BOOLEAN | |
| priority | INTEGER | |
| status | VARCHAR(30) | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

### Possible `contact_type` values

```text
EMERGENCY_DISPATCH
FIRE_CONTROL_ROOM
FIRE_STATION
```

### Possible `channel` values

```text
VOICE
SMS
EMAIL
WEBHOOK
API
```

### Possible `status` values

```text
ACTIVE
INACTIVE
SUSPENDED
```