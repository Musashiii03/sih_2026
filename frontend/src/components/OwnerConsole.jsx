/**
 * OwnerConsole — Atmarakshak Command Center
 * Modeled after Atmarakshak Safety Monitor (hazard-monitor-8)
 *
 * Views:
 *  1. Command Overview (KPIs, Org Safety Matrix, System Readiness)
 *  2. Live Monitoring (CCTV Feed, YOLO bounding box, AI Detection Simulator)
 *  3. Incident History (Search, Filter, Incident Details, Acknowledge/Resolve)
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Video,
  History,
  Shield,
  ShieldAlert,
  Flame,
  Droplets,
  Wind,
  CheckCircle,
  AlertTriangle,
  LogOut,
  ChevronDown,
  Search,
  ExternalLink,
  Radio,
  Check,
  X,
  Clock,
  ArrowRight,
  Activity,
  Layers,
  Camera,
  Building2,
  TrendingUp,
  Wifi,
  Bell
} from 'lucide-react';
import AddOrganization from './AddOrganization';
import AddBuilding from './AddBuilding';
import BuildingDetail from './BuildingDetail';
import { useFireAlerts } from '../hooks/useFireAlerts';
import FireAlertNotification from './FireAlertNotification';
import { useTheme } from '../context/ThemeContext';
import TimerDebugPanel from './TimerDebugPanel';

import './ApexConsole.css';

// ─── SEEDED ORGANIZATIONS & SITES ────────────────────────────────────
const ORGANIZATIONS = [
  {
    id: 'APX-01',
    code: 'APX-01',
    name: 'Atmarakshak Industrial Group',
    buildingsCount: 2,
    safetyScore: 94,
    alertsCount: 11,
    facilities: [
      { id: 'AOH-01', code: 'AOH-01', name: 'Atmarakshak Operations Hub' },
      { id: 'MRL-02', code: 'MRL-02', name: 'Materials Research Lab' },
    ],
  },
  {
    id: 'NSL-02',
    code: 'NSL-02',
    name: 'Northstar Logistics',
    buildingsCount: 1,
    safetyScore: 88,
    alertsCount: 3,
    facilities: [
      { id: 'NST-04', code: 'NST-04', name: 'Northstar Terminal A' },
    ],
  },
];

// ─── SEEDED CAMERAS ──────────────────────────────────────────────────
const CAMERAS = [
  {
    id: 'CAM-04',
    code: 'CAM-04',
    room: 'Chemistry Lab',
    location: 'Materials Research Lab — aet Chemistry Lab',
    facilityId: 'MRL-02',
    orgId: 'APX-01',
    health: 'maintenance',
    signalStrength: 96,
    fps: 28,
    resolution: '1080p',
    image: '/cctv/camera_render.jpg',
  },
  {
    id: 'CAM-05',
    code: 'CAM-05',
    room: 'Dock 04',
    location: 'Northstar Terminal 1 / Dock 04',
    facilityId: 'NST-04',
    orgId: 'NSL-02',
    health: 'healthy',
    signalStrength: 98,
    fps: 30,
    resolution: '1080p',
    image: '/cctv/surveillance_dock.jpg',
  },
  {
    id: 'CAM-06',
    code: 'CAM-06',
    room: 'Mezzanine',
    location: 'Northstar Terminal 1 / Mezzanine',
    facilityId: 'NST-04',
    orgId: 'NSL-02',
    health: 'healthy',
    signalStrength: 92,
    fps: 25,
    resolution: '1080p',
    image: '/cctv/camera_render.jpg',
  },
];

// ─── INITIAL INCIDENTS (From Video) ──────────────────────────────────
const INITIAL_INCIDENTS = [
  {
    id: 'INC-A911E5',
    type: 'FIRE',
    location: 'Northstar Terminal 1 / Dock 04',
    facilityId: 'NST-04',
    camera: 'CAM-05',
    severity: 'HIGH',
    confidence: 91,
    status: 'UNACKNOWLEDGED',
    created: 'Sep 05, 11:18 PM',
    operatorNote: 'AI detection created by Morgan Reed · Atmarakshak AI Monitor',
    image: '/cctv/surveillance_dock.jpg',
  },
  {
    id: 'INC-D09460',
    type: 'SMOKE',
    location: 'Atmarakshak Operations Hub / Loading Bay A',
    facilityId: 'AOH-01',
    camera: 'CAM-02',
    severity: 'MEDIUM',
    confidence: 88,
    status: 'UNACKNOWLEDGED',
    created: 'Sep 05, 11:10 PM',
    operatorNote: 'Optical density exceeded threshold 450ppm',
    image: '/cctv/camera_render.jpg',
  },
  {
    id: 'INC-496C61',
    type: 'FIRE',
    location: 'Northstar Terminal 1 / Dock 04',
    facilityId: 'NST-04',
    camera: 'CAM-05',
    severity: 'HIGH',
    confidence: 94,
    status: 'UNACKNOWLEDGED',
    created: 'Sep 05, 09:38 PM',
    operatorNote: 'YOLO verified thermal temporal confirmation',
    image: '/cctv/surveillance_dock.jpg',
  },
  {
    id: 'INC-5BCE5E',
    type: 'WATER LEAK',
    location: 'Northstar Terminal 1 / Dock 04',
    facilityId: 'NST-04',
    camera: 'CAM-05',
    severity: 'LOW',
    confidence: 82,
    status: 'ACKNOWLEDGED',
    created: 'Sep 05, 09:14 PM',
    operatorNote: 'Sump pump overflow flagged in sector 4',
    image: '/cctv/camera_render.jpg',
  },
  {
    id: 'INC-3DCFF1',
    type: 'FIRE',
    location: 'Atmarakshak Operations Hub / Loading Bay A',
    facilityId: 'AOH-01',
    camera: 'CAM-01',
    severity: 'HIGH',
    confidence: 96,
    status: 'ACKNOWLEDGED',
    created: 'Sep 05, 09:02 PM',
    operatorNote: 'Verified thermal flare near forklift charge bay',
    image: '/cctv/surveillance_dock.jpg',
  },
  {
    id: 'INC-7E8C6D',
    type: 'FIRE',
    location: 'Atmarakshak Operations Hub / Loading Bay A',
    facilityId: 'AOH-01',
    camera: 'CAM-01',
    severity: 'CRITICAL',
    confidence: 97,
    status: 'UNACKNOWLEDGED',
    created: 'Sep 05, 08:52 PM',
    operatorNote: 'Direct flame visible in pallet storage rack',
    image: '/cctv/surveillance_dock.jpg',
  },
  {
    id: 'INC-923398',
    type: 'FIRE',
    location: 'Atmarakshak Operations Hub / Loading Bay A',
    facilityId: 'AOH-01',
    camera: 'CAM-01',
    severity: 'HIGH',
    confidence: 89,
    status: 'RESOLVED',
    created: 'Sep 05, 08:30 PM',
    operatorNote: 'Extinguished by on-site safety marshal',
    image: '/cctv/camera_render.jpg',
  },
  {
    id: 'INC-D88748',
    type: 'FIRE',
    location: 'Atmarakshak Operations Hub / Loading Bay A',
    facilityId: 'AOH-01',
    camera: 'CAM-01',
    severity: 'MEDIUM',
    confidence: 85,
    status: 'RESOLVED',
    created: 'Sep 05, 08:12 PM',
    operatorNote: 'Resolved and cleared by station chief',
    image: '/cctv/surveillance_dock.jpg',
  },
  {
    id: 'INC-30F8FD',
    type: 'SMOKE',
    location: 'Atmarakshak Operations Hub / Loading Bay A',
    facilityId: 'AOH-01',
    camera: 'CAM-02',
    severity: 'MEDIUM',
    confidence: 90,
    status: 'UNACKNOWLEDGED',
    created: 'Sep 05, 08:00 PM',
    operatorNote: 'Exhaust duct particulate backflow detected',
    image: '/cctv/camera_render.jpg',
  },
  {
    id: 'INC-88E771',
    type: 'FIRE',
    location: 'Atmarakshak Operations Hub / Loading Bay A',
    facilityId: 'AOH-01',
    camera: 'CAM-01',
    severity: 'HIGH',
    confidence: 92,
    status: 'UNACKNOWLEDGED',
    created: 'Sep 05, 07:44 PM',
    operatorNote: 'Pallet flare detected by thermal camera',
    image: '/cctv/surveillance_dock.jpg',
  },
  {
    id: 'INC-0C349A',
    type: 'WATER LEAK',
    location: 'Atmarakshak Operations Hub / Loading Bay A',
    facilityId: 'AOH-01',
    camera: 'CAM-03',
    severity: 'LOW',
    confidence: 84,
    status: 'RESOLVED',
    created: 'Sep 05, 07:18 PM',
    operatorNote: 'Valve closed and dry mop initiated',
    image: '/cctv/camera_render.jpg',
  },
  {
    id: 'INC-F73953',
    type: 'SMOKE',
    location: 'Materials Research Lab / Chemistry Lab',
    facilityId: 'MRL-02',
    camera: 'CAM-04',
    severity: 'MEDIUM',
    confidence: 89,
    status: 'RESOLVED',
    created: 'Sep 05, 07:05 PM',
    operatorNote: 'Fume hood damper calibrated and resolved',
    image: '/cctv/camera_render.jpg',
  },
];

export default function OwnerConsole() {
  const navigate = useNavigate();
  const { theme, toggle: toggleTheme } = useTheme();

  // Fire Alerts Hook
  const { 
    activeAlerts, 
    acknowledgeAlert, 
    dismissAlert,
    verifyAlert,
    buildingsWithAlerts,
    alertCount,
    _allAlerts,
    _seenIncidentIds
  } = useFireAlerts();

  // Debug logging
  useEffect(() => {
    console.log('📊 OwnerConsole - Fire Alerts State:');
    console.log('   Active Alerts:', activeAlerts);
    console.log('   All Alerts (debug):', _allAlerts);
    console.log('   Seen Incident IDs:', _seenIncidentIds);
    console.log('   Buildings with Alerts:', buildingsWithAlerts);
    console.log('   Alert Count:', alertCount);
  }, [activeAlerts, _allAlerts, _seenIncidentIds, buildingsWithAlerts, alertCount]);

  // Navigation tabs: 'overview' | 'monitoring' | 'incidents' | 'add-organization' | 'add-building' | 'building-detail'
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [activeIncidentForBuilding, setActiveIncidentForBuilding] = useState(null);

  // Organizations & Buildings from API
  const [organizations, setOrganizations] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [expandedOrgId, setExpandedOrgId] = useState(null);

  // Organizations & Selected Facility
  const [selectedOrgId, setSelectedOrgId] = useState('APX-01');
  const [selectedFacilityId, setSelectedFacilityId] = useState('AOH-01');

  // Live Monitoring State
  const [selectedCameraId, setSelectedCameraId] = useState('CAM-04');
  const [simulatedHazard, setSimulatedHazard] = useState(null); // 'fire' | 'smoke' | 'water' | null
  const [hazardConfidence, setHazardConfidence] = useState(96);
  const [hazardConfirmed, setHazardConfirmed] = useState(false);
  const [liveTime, setLiveTime] = useState('');

  // Incidents State
  const [incidents, setIncidents] = useState(INITIAL_INCIDENTS);
  const [selectedIncidentId, setSelectedIncidentId] = useState('INC-A911E5');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [operatorNoteInput, setOperatorNoteInput] = useState('');

  // Floating Toasts Stack
  const [toasts, setToasts] = useState([
    { id: 1, text: 'Owner session established', type: 'success' }
  ]);

  // Push Toast helper
  const showToast = (text, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Fetch Organizations and Buildings
  useEffect(() => {
    fetchOrganizations();
    fetchBuildings();
    fetchIncidents();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/organizations?limit=100');
      if (response.ok) {
        const data = await response.json();
        setOrganizations(data.data.organizations || []);
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
    }
  };

  const fetchBuildings = async () => {
    try {
      const response = await fetch('/api/buildings?limit=100');
      if (response.ok) {
        const data = await response.json();
        setBuildings(data.data.buildings || []);
      }
    } catch (error) {
      console.error('Error fetching buildings:', error);
    }
  };

  const fetchIncidents = async () => {
    try {
      console.log('📋 Fetching incident history from API...');
      const response = await fetch('http://localhost:3001/api/incidents/history?limit=100');
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Fetched incidents:', data.data.incidents);
        
        if (data.success && data.data.incidents.length > 0) {
          setIncidents(data.data.incidents);
          // Set first incident as selected if none selected
          if (!selectedIncidentId && data.data.incidents.length > 0) {
            setSelectedIncidentId(data.data.incidents[0].id);
          }
        } else {
          console.log('ℹ️ No incidents found, using mock data');
          // Keep INITIAL_INCIDENTS as fallback
        }
      }
    } catch (error) {
      console.error('❌ Error fetching incidents:', error);
      console.log('ℹ️ Using mock incident data as fallback');
      // Keep INITIAL_INCIDENTS as fallback
    }
  };

  // Toggle organization expansion
  const toggleOrganization = (orgId) => {
    setExpandedOrgId(expandedOrgId === orgId ? null : orgId);
  };

  // Get buildings for an organization
  const getOrganizationBuildings = (orgId) => {
    return buildings.filter(b => b.organization_id === orgId);
  };

  // Get buildings without organization
  const getUnassignedBuildings = () => {
    return buildings.filter(b => !b.organization_id);
  };

  // Handle building click
  const handleBuildingClick = (building) => {
    setSelectedBuilding(building);
    setActiveIncidentForBuilding(null); // Clear any active incident
    setActiveTab('building-detail');
  };

  // Clock runner
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLiveTime(now.toLocaleTimeString('en-US', { hour12: true }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Selected Org and Camera objects
  const currentOrg = useMemo(() => {
    return ORGANIZATIONS.find((o) => o.id === selectedOrgId) || ORGANIZATIONS[0];
  }, [selectedOrgId]);

  const currentCamera = useMemo(() => {
    return CAMERAS.find((c) => c.id === selectedCameraId) || CAMERAS[0];
  }, [selectedCameraId]);

  const selectedIncident = useMemo(() => {
    return incidents.find((i) => i.id === selectedIncidentId) || incidents[0];
  }, [incidents, selectedIncidentId]);

  // Counts
  const activeIncidentsCount = useMemo(() => {
    return incidents.filter((i) => i.status === 'UNACKNOWLEDGED').length;
  }, [incidents]);

  // Filtered Incidents
  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      const matchesStatus =
        statusFilter === 'ALL' ? true : inc.status === statusFilter;
      const matchesQuery =
        inc.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inc.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inc.location.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesQuery;
    });
  }, [incidents, statusFilter, searchQuery]);

  // Trigger Simulation
  const handleSimulate = (type) => {
    setSimulatedHazard(type);
    const conf = type === 'fire' ? 96 : type === 'smoke' ? 91 : 88;
    setHazardConfidence(conf);
    setHazardConfirmed(true);

    const typeNames = {
      fire: 'Fire signature temporally verified',
      smoke: 'Smoke signature temporally verified',
      water: 'Water leak signature temporally verified',
    };
    showToast(typeNames[type], type === 'fire' ? 'alert' : 'info');
  };

  // Create Incident from Simulator
  const handleCreateIncidentRecord = () => {
    if (!simulatedHazard) return;
    const randomHex = Math.random().toString(16).substring(2, 8).toUpperCase();
    const newId = `INC-${randomHex}`;
    const hazardType =
      simulatedHazard === 'fire'
        ? 'FIRE'
        : simulatedHazard === 'smoke'
        ? 'SMOKE'
        : 'WATER LEAK';

    const now = new Date();
    const dateStr = `${now.toLocaleString('default', { month: 'short' })} ${now.getDate().toString().padStart(2, '0')}, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    const newInc = {
      id: newId,
      type: hazardType,
      location: currentCamera.location,
      facilityId: currentCamera.facilityId,
      camera: currentCamera.code,
      severity: simulatedHazard === 'water' ? 'LOW' : 'HIGH',
      confidence: hazardConfidence,
      status: 'UNACKNOWLEDGED',
      created: dateStr,
      operatorNote: `AI detection created by Morgan Reed · Atmarakshak AI Monitor`,
      image: currentCamera.image,
    };

    setIncidents((prev) => [newInc, ...prev]);
    setSelectedIncidentId(newId);
    showToast(`${newId} created — operator action required`, 'alert');

    // Reset simulator preview
    setSimulatedHazard(null);
    setHazardConfirmed(false);
  };

  // Acknowledge Incident
  const handleAcknowledge = () => {
    if (!selectedIncident) return;
    setIncidents((prev) =>
      prev.map((i) =>
        i.id === selectedIncident.id ? { ...i, status: 'ACKNOWLEDGED' } : i
      )
    );
    showToast(`Incident ${selectedIncident.id} is now acknowledged`, 'success');
  };

  // Resolve Incident
  const handleResolve = () => {
    if (!selectedIncident) return;
    setIncidents((prev) =>
      prev.map((i) =>
        i.id === selectedIncident.id ? { ...i, status: 'RESOLVED' } : i
      )
    );
    showToast(`Incident ${selectedIncident.id} marked as resolved`, 'success');
  };

  // Navigate to building dashboard from incident history
  const handleViewBuildingDashboard = (incident) => {
    if (!incident || !incident.building_id) {
      showToast('Building information not available for this incident', 'alert');
      return;
    }

    console.log('📍 Navigating to building dashboard for incident:', incident.incident_number);
    
    // Find the building
    const building = buildings.find(b => b.id === incident.building_id);
    
    if (building) {
      // Set the active incident for the building view
      setActiveIncidentForBuilding(incident.incident_number);
      
      // Navigate to building detail view
      setSelectedBuilding(building);
      setActiveTab('building-detail');
      
      showToast(`Opening ${building.name} dashboard`, 'info');
    } else {
      console.warn(`Building ${incident.building_id} not found`);
      showToast(`Building not found for incident ${incident.incident_number}`, 'alert');
    }
  };

  // Sign out handler
  const handleSignOut = () => {
    showToast('Session closed', 'info');
    setTimeout(() => {
      navigate('/login');
    }, 600);
  };

  // Handle fire alert acknowledgment
  const handleAcknowledgeFireAlert = async (incidentNumber) => {
    console.log(`🔔 Acknowledging fire alert: ${incidentNumber}`);
    
    const result = await acknowledgeAlert(incidentNumber);
    
    console.log('Acknowledgment result:', result);
    
    if (result.success && result.alert) {
      showToast(`Incident ${incidentNumber} acknowledged`, 'success');
      
      // Refresh incidents list to show updated status
      fetchIncidents();
      
      // Find the building for this alert
      const alertBuilding = buildings.find(b => b.id === result.alert.building_id);
      
      console.log('Found building:', alertBuilding);
      
      if (alertBuilding) {
        // Set the active incident for the building
        setActiveIncidentForBuilding(incidentNumber);
        
        // Navigate to building detail view
        setSelectedBuilding(alertBuilding);
        setActiveTab('building-detail');
      } else {
        console.warn(`Building ${result.alert.building_id} not found in buildings list`);
        showToast(`Building not found for incident ${incidentNumber}`, 'alert');
      }
    } else {
      const errorMsg = result.error || 'Unknown error';
      console.error(`Failed to acknowledge: ${errorMsg}`);
      showToast(`Failed to acknowledge incident ${incidentNumber}: ${errorMsg}`, 'alert');
    }
  };

  // Show toast when alert is auto-escalated
  useEffect(() => {
    const escalatedAlerts = activeAlerts.filter(a => a.escalated && a.timeRemaining === 0);
    
    escalatedAlerts.forEach(alert => {
      // Only show toast once when escalated
      if (!alert.toastShown) {
        showToast(
          `Incident ${alert.incident_number} auto-escalated to fire department (placeholder)`, 
          'alert'
        );
        // Mark toast as shown to prevent duplicates
        alert.toastShown = true;
      }
    });
  }, [activeAlerts]);

  return (
    <div className="apex-app-root">
      {/* ─── FIRE ALERT NOTIFICATIONS (Top-Right) ─── */}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        maxWidth: '400px'
      }}>
        {activeAlerts.map((alert) => (
          <FireAlertNotification
            key={alert.incident_number}
            alert={alert}
            onAcknowledge={handleAcknowledgeFireAlert}
            onDismiss={dismissAlert}
          />
        ))}
      </div>

      {/* ─── FLOATING TOASTS ─── */}
      <div className="apex-toast-stack">
        {toasts.map((t) => (
          <div key={t.id} className={`apex-toast ${t.type}`}>
            {t.type === 'success' && <Check size={16} color="#4ade80" />}
            {t.type === 'alert' && <Flame size={16} color="#fb4934" />}
            {t.type === 'info' && <Activity size={16} color="#fabd2f" />}
            <span>{t.text}</span>
            <button
              onClick={() => removeToast(t.id)}
              style={{
                background: 'none',
                border: 'none',
                color: '#8b928a',
                cursor: 'pointer',
                padding: '0 0 0 8px',
              }}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* ─── GLASSY SIDEBAR ─── */}
      <aside className="glassy-sidebar">
        {/* Logo + Brand */}
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            <img
              src="/atmarakshak_logo.png"
              alt="Atmarakshak"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
          <span className="sidebar-brand-name">ATMA<span style={{ background: 'linear-gradient(120deg, #fabd2f, #fe8019)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>RAKSHAK</span></span>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <button
            className={`sidebar-nav-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </button>
          <button
            className={`sidebar-nav-btn ${activeTab === 'incidents' ? 'active' : ''}`}
            onClick={() => setActiveTab('incidents')}
          >
            <History size={20} />
            <span>Incident History</span>
            {activeIncidentsCount > 0 && (
              <span className="sidebar-badge">{activeIncidentsCount}</span>
            )}
          </button>
        </nav>

        {/* Organizations & Buildings List */}
        <div className="sidebar-section">
          <div className="sidebar-section-title">Organizations & Buildings</div>
          <div className="sidebar-tree">
            {/* Organizations with Buildings */}
            {organizations.map(org => {
              const orgBuildings = getOrganizationBuildings(org.id);
              const isExpanded = expandedOrgId === org.id;
              const hasFireAlertInOrg = orgBuildings.some(b => buildingsWithAlerts.includes(b.id));
              
              return (
                <div key={org.id} className="tree-item">
                  <div 
                    className={`tree-org-item ${hasFireAlertInOrg ? 'has-fire-alert' : ''}`}
                    onClick={() => toggleOrganization(org.id)}
                  >
                    <ChevronDown 
                      size={16} 
                      className={`tree-chevron ${isExpanded ? 'expanded' : ''}`}
                    />
                    <Shield size={16} className="tree-icon org-icon" />
                    <span className="tree-label">{org.name}</span>
                    <span className="tree-count">{orgBuildings.length}</span>
                  </div>
                  {isExpanded && orgBuildings.length > 0 && (
                    <div className="tree-children">
                      {orgBuildings.map(building => {
                        const hasFireAlert = buildingsWithAlerts.includes(building.id);
                        
                        return (
                          <div 
                            key={building.id} 
                            className={`tree-building-item ${hasFireAlert ? 'building-fire-alert' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBuildingClick(building);
                            }}
                          >
                            {hasFireAlert && <Flame size={14} className="tree-icon fire-alert-icon" />}
                            <Layers size={14} className="tree-icon building-icon" />
                            <span className="tree-label">{building.name}</span>
                            {hasFireAlert && (
                              <span className="fire-alert-badge" title="Fire detected">🔥</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Unassigned Buildings - shown directly */}
            {getUnassignedBuildings().map(building => {
              const hasFireAlert = buildingsWithAlerts.includes(building.id);
              
              return (
                <div key={building.id} className="tree-item">
                  <div 
                    className={`tree-building-item tree-building-direct ${hasFireAlert ? 'building-fire-alert' : ''}`}
                    onClick={() => handleBuildingClick(building)}
                  >
                    {hasFireAlert && <Flame size={16} className="tree-icon fire-alert-icon" />}
                    <Layers size={16} className="tree-icon building-icon" />
                    <span className="tree-label">{building.name}</span>
                    {hasFireAlert && (
                      <span className="fire-alert-badge" title="Fire detected">🔥</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="sidebar-actions">
          <button
            className="sidebar-action-btn"
            onClick={() => setActiveTab('add-organization')}
          >
            <span>+ Add Organization</span>
          </button>
          <button
            className="sidebar-action-btn"
            onClick={() => setActiveTab('add-building')}
          >
            <span>+ Add Building</span>
          </button>
        </div>

        {/* Profile */}
        <div className="sidebar-profile">
          <div className="sidebar-profile-avatar">MR</div>
          <div className="sidebar-profile-info">
            <div className="sidebar-profile-name">Morgan Reed</div>
            <div className="sidebar-profile-role">Owner</div>
          </div>
        </div>
      </aside>

      {/* ─── MAIN CONTENT VIEWPORT ─── */}
      <main className="apex-main-viewport">

        {/* ─── TOP COMMAND BAR ─── */}
        <header className="apex-topbar">
          <div className="apex-topbar-left">
            <div>
              <div className="apex-topbar-title">
                {activeTab === 'overview' && 'Command Overview'}
                {activeTab === 'monitoring' && 'Live Monitoring'}
                {activeTab === 'incidents' && 'Incident History'}
                {activeTab === 'add-organization' && 'Add Organization'}
                {activeTab === 'add-building' && 'Add Building'}
                {activeTab === 'building-detail' && (selectedBuilding?.name || 'Building Detail')}
              </div>
              <div className="apex-topbar-subtitle">ATMARAKSHAK OWNER CONSOLE · SAFETY COMMAND</div>
            </div>
          </div>
          <div className="apex-topbar-right">
            <div className="apex-system-status">
              <div className="apex-system-status-dot" />
              <span className="apex-system-status-text">SYSTEMS NOMINAL</span>
            </div>
            <div className="apex-topbar-clock">{liveTime}</div>
            <button
              className="apex-theme-toggle-btn"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light mode' : 'Switch to Dark mode'}
            >
              {theme === 'dark' ? (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              ) : (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              )}
              {theme === 'dark' ? 'Light' : 'Dark'}
            </button>
            <button className="apex-signout-btn" onClick={handleSignOut}>
              <LogOut size={15} />
              <span>Sign Out</span>
            </button>
          </div>
        </header>

        {/* Content Body */}
        <div className="apex-content-area-new">
          {/* ═════════════════════════════════════════════════════════════ */}
          {/* TAB 1: COMMAND OVERVIEW                                      */}
          {/* ═════════════════════════════════════════════════════════════ */}
          {activeTab === 'overview' && (
            <div>
              {/* 4 KPI Cards */}
              <div className="apex-kpi-row">
                {/* Active Incidents */}
                <div className={`apex-kpi-card ${activeIncidentsCount > 0 ? 'kpi-danger' : 'kpi-success'}`}>
                  <div className="apex-kpi-icon-row">
                    <div className={`apex-kpi-icon ${activeIncidentsCount > 0 ? 'danger' : 'success'}`}>
                      <ShieldAlert size={18} />
                    </div>
                    {activeIncidentsCount > 0 && <div className="apex-kpi-live-dot" />}
                  </div>
                  <div className="apex-kpi-label">ACTIVE INCIDENTS</div>
                  <div className={`apex-kpi-value ${activeIncidentsCount > 0 ? 'danger' : 'success'}`}>{activeIncidentsCount}</div>
                  <div className="apex-kpi-sub">{activeIncidentsCount > 0 ? 'Requires operator review' : 'All incidents clear'}</div>
                </div>

                {/* Safety Score */}
                <div className="apex-kpi-card kpi-success">
                  <div className="apex-kpi-icon-row">
                    <div className="apex-kpi-icon success">
                      <TrendingUp size={18} />
                    </div>
                  </div>
                  <div className="apex-kpi-label">SAFETY SCORE</div>
                  <div className="apex-kpi-value">91%</div>
                  <div className="apex-kpi-sub">Across all monitored sites</div>
                  <div className="apex-kpi-bar">
                    <div className="apex-kpi-bar-fill" style={{ width: '91%' }} />
                  </div>
                </div>

                {/* Buildings */}
                <div className="apex-kpi-card">
                  <div className="apex-kpi-icon-row">
                    <div className="apex-kpi-icon amber">
                      <Building2 size={18} />
                    </div>
                  </div>
                  <div className="apex-kpi-label">BUILDINGS</div>
                  <div className="apex-kpi-value">{String(buildings.length).padStart(2, '0')}</div>
                  <div className="apex-kpi-sub">{organizations.length} organization{organizations.length !== 1 ? 's' : ''}</div>
                </div>

                {/* Cameras Online */}
                <div className="apex-kpi-card kpi-blue">
                  <div className="apex-kpi-icon-row">
                    <div className="apex-kpi-icon blue">
                      <Wifi size={18} />
                    </div>
                  </div>
                  <div className="apex-kpi-label">CAMERAS ONLINE</div>
                  <div className="apex-kpi-value">5/6</div>
                  <div className="apex-kpi-sub">Network availability</div>
                </div>
              </div>

              {/* Matrix + Readiness Grid */}
              <div className="apex-overview-grid">
                {/* Left: Safety Matrix */}
                <div className="apex-panel">
                  <div className="apex-panel-header">
                    <span className="apex-panel-title">SAFETY MATRIX</span>
                    <span className="apex-tag-badge">{organizations.length} ORGS · {buildings.length} BUILDINGS</span>
                  </div>

                  {/* Organizations */}
                  <div className="safety-matrix-section">
                    <div className="safety-section-label">ORGANIZATIONS</div>
                    <div className="apex-org-card-list">
                      {organizations.length > 0 ? (
                        organizations.map((org) => {
                          const orgBuildings = getOrganizationBuildings(org.id);
                          return (
                            <div
                              key={org.id}
                              className="apex-org-card"
                            >
                              <div>
                                <div className="apex-org-name">
                                  <Shield size={16} style={{ color: '#fe8019' }} />
                                  <span>{org.name}</span>
                                </div>
                                <div className="apex-org-sub">
                                  {org.organization_type} · {orgBuildings.length} buildings
                                </div>
                              </div>

                              <div className="apex-org-stats">
                                <div className="apex-stat-col">
                                  <div className="apex-stat-label">STATUS</div>
                                  <div className={`apex-stat-val ${org.status === 'ACTIVE' ? 'green' : 'amber'}`}>
                                    {org.status}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--apex-text-muted)', fontSize: '13px' }}>
                          No organizations found. Click "Add Organization" to create one.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Buildings */}
                  <div className="safety-matrix-section">
                    <div className="safety-section-label">BUILDINGS</div>
                    <div className="apex-org-card-list">
                      {buildings.length > 0 ? (
                        buildings.slice(0, 5).map((building) => {
                          const org = organizations.find(o => o.id === building.organization_id);
                          return (
                            <div
                              key={building.id}
                              className="apex-org-card"
                            >
                              <div>
                                <div className="apex-org-name">
                                  <Layers size={16} style={{ color: '#83a598' }} />
                                  <span>{building.name}</span>
                                </div>
                                <div className="apex-org-sub">
                                  {building.building_type} · {building.number_of_floors} floors · {org ? org.name : 'No organization'}
                                </div>
                              </div>

                              <div className="apex-org-stats">
                                <div className="apex-stat-col">
                                  <div className="apex-stat-label">STATUS</div>
                                  <div className={`apex-stat-val ${building.status === 'ACTIVE' ? 'green' : 'amber'}`}>
                                    {building.status}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--apex-text-muted)', fontSize: '13px' }}>
                          No buildings found. Click "Add Building" to create one.
                        </div>
                      )}
                    </div>
                    {buildings.length > 5 && (
                      <div style={{ padding: '12px 18px', textAlign: 'center', fontSize: '12px', color: 'var(--apex-text-muted)', borderTop: '1px solid var(--apex-border-dim)' }}>
                        + {buildings.length - 5} more buildings
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: System Readiness */}
                <div className="apex-panel">
                  <div className="apex-panel-header">
                    <span className="apex-panel-title">SYSTEM READINESS</span>
                  </div>

                  <div className="apex-readiness-item">
                    <div className="apex-readiness-title-row">
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#eae7df' }}>Detection engine</span>
                      <span
                        style={{
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: 10,
                          fontWeight: 700,
                          color: '#4ade80',
                          border: '1px solid rgba(74, 222, 128, 0.3)',
                          background: 'rgba(74, 222, 128, 0.08)',
                          padding: '1px 8px',
                          borderRadius: 4,
                        }}
                      >
                        NOMINAL
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--apex-text-muted)' }}>
                      YOLO temporal verification
                    </div>
                  </div>

                  <div className="apex-readiness-item">
                    <div className="apex-readiness-title-row">
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#eae7df' }}>Camera uplink</span>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#4ade80' }}>83%</span>
                    </div>
                    <div className="apex-kpi-bar" style={{ marginTop: 4 }}>
                      <div className="apex-kpi-bar-fill" style={{ width: '83%' }} />
                    </div>
                  </div>

                  <div className="apex-readiness-item">
                    <div className="apex-stat-label" style={{ marginBottom: 6 }}>NETWORK HEARTBEAT</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="apex-pulse-dot" />
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#eae7df' }}>
                        ALL systems reporting
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* TAB 2: LIVE MONITORING                                       */}
          {/* ═════════════════════════════════════════════════════════════ */}
          {activeTab === 'monitoring' && (
            <div className="apex-monitoring-grid">
              {/* Left Column: CCTV Screen Player */}
              <div className="apex-cctv-container">
                <div className="apex-cctv-header">
                  <div className="apex-cctv-feed-title">
                    <span className="apex-live-tag">
                      <span className="apex-live-dot" />
                      LIVE CCTV / {currentCamera.code}
                    </span>
                  </div>
                  <div className="apex-cctv-clock">{liveTime}</div>
                </div>

                <div style={{ padding: '6px 18px', background: 'var(--apex-bg-surface-alt)', borderBottom: '1px solid var(--apex-border-dim)', fontSize: 12, color: 'var(--apex-text-muted)' }}>
                  {currentCamera.location}
                </div>

                {/* Screen View */}
                <div className="apex-cctv-screen">
                  <img
                    src={currentCamera.image}
                    alt="CCTV Feed"
                    className="apex-cctv-img"
                  />
                  <div className="apex-scanlines" />
                  <div className="apex-cctv-hud-crosshair" />
                  <div className="apex-cctv-hud-camid">{currentCamera.code} // {currentCamera.room.toUpperCase()}</div>

                  {/* Simulated Bounding Box when hazard triggered */}
                  {simulatedHazard && (
                    <div
                      className="apex-bounding-box"
                      style={{
                        borderColor: simulatedHazard === 'fire' ? '#fb4934' : simulatedHazard === 'smoke' ? '#fabd2f' : '#83a598',
                      }}
                    >
                      <div
                        className="apex-bounding-badge"
                        style={{
                          background: simulatedHazard === 'fire' ? '#fb4934' : simulatedHazard === 'smoke' ? '#fabd2f' : '#83a598',
                          color: simulatedHazard === 'smoke' ? '#1c1e1d' : '#ffffff',
                        }}
                      >
                        {simulatedHazard.toUpperCase()} — {hazardConfidence}%
                      </div>
                      <div
                        className="apex-bounding-sub"
                        style={{
                          color: simulatedHazard === 'fire' ? '#fb4934' : simulatedHazard === 'smoke' ? '#fabd2f' : '#83a598',
                        }}
                      >
                        YOLO / TEMPORAL LOCK
                      </div>
                    </div>
                  )}

                  {/* Bottom CCTV Status Pill */}
                  <div className={`apex-cctv-bottom-bar ${simulatedHazard ? 'hazard' : 'normal'}`}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: simulatedHazard ? '#fb4934' : '#4ade80' }} />
                    <span>
                      {simulatedHazard
                        ? `ACTIVE HAZARD CONFIRMED · ${simulatedHazard.toUpperCase()} DETECTED`
                        : 'NO ACTIVE DETECTION · MONITORING'}
                    </span>
                  </div>
                </div>

                {/* Camera Switcher Tabs */}
                <div className="apex-camera-tabs">
                  {CAMERAS.map((cam) => {
                    const isActive = selectedCameraId === cam.id;
                    return (
                      <button
                        key={cam.id}
                        className={`apex-cam-tab-btn ${isActive ? 'active' : ''}`}
                        onClick={() => setSelectedCameraId(cam.id)}
                      >
                        <span className="apex-cam-tab-id">{cam.code}</span>
                        <span className="apex-cam-tab-room">{cam.room}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Camera Health info */}
                <div style={{ padding: '14px 18px', background: 'var(--apex-bg-deep)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--apex-border-dim)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--apex-text-muted)' }}>CAMERA HEALTH</span>
                    <span
                      style={{
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: 10,
                        fontWeight: 600,
                        color: currentCamera.health === 'healthy' ? '#4ade80' : '#fabd2f',
                        background: currentCamera.health === 'healthy' ? 'rgba(74, 222, 128, 0.1)' : 'rgba(250, 189, 47, 0.1)',
                        border: `1px solid ${currentCamera.health === 'healthy' ? 'rgba(74, 222, 128, 0.3)' : 'rgba(250, 189, 47, 0.3)'}`,
                        padding: '1px 8px',
                        borderRadius: 4,
                      }}
                    >
                      {currentCamera.health}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>
                    <span style={{ color: 'var(--apex-text-muted)' }}>Signal strength</span>
                    <div style={{ width: 60, height: 4, background: '#2f3531', borderRadius: 2 }}>
                      <div style={{ width: `${currentCamera.signalStrength}%`, height: '100%', background: '#4ade80', borderRadius: 2 }} />
                    </div>
                    <span style={{ color: '#4ade80' }}>{currentCamera.signalStrength}%</span>
                  </div>
                </div>
              </div>

              {/* Right Column: AI Detection Simulator */}
              <div className="apex-panel">
                <div className="apex-panel-header">
                  <span className="apex-panel-title">AI DETECTION SIMULATOR</span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--apex-text-muted)', lineHeight: 1.5, margin: '0 0 20px 0' }}>
                  Trigger a controlled signal to test the temporal verification and incident workflow.
                </p>

                {/* Simulation Buttons */}
                <button className="apex-sim-btn fire" onClick={() => handleSimulate('fire')}>
                  <span>SIMULATE FIRE</span>
                  <ArrowRight size={14} />
                </button>

                <button className="apex-sim-btn smoke" onClick={() => handleSimulate('smoke')}>
                  <span>SIMULATE SMOKE</span>
                  <ArrowRight size={14} />
                </button>

                <button className="apex-sim-btn water" onClick={() => handleSimulate('water')}>
                  <span>SIMULATE WATER LEAK</span>
                  <ArrowRight size={14} />
                </button>

                {/* Hazard Confirmed Card */}
                {hazardConfirmed && simulatedHazard && (
                  <div className="apex-hazard-confirmed-box">
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#fb4934', letterSpacing: '0.06em', marginBottom: 4 }}>
                      HAZARD CONFIRMED
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: '#f7f5ed', textTransform: 'capitalize', margin: '2px 0 10px 0' }}>
                      {simulatedHazard}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontFamily: 'JetBrains Mono, monospace', fontSize: 11, borderTop: '1px solid rgba(251, 73, 52, 0.2)', paddingTop: 10 }}>
                      <div>
                        <span style={{ color: 'var(--apex-text-muted)', display: 'block', fontSize: 10 }}>CONFIDENCE</span>
                        <strong style={{ color: '#fb4934', fontSize: 14 }}>{hazardConfidence}%</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--apex-text-muted)', display: 'block', fontSize: 10 }}>TEMPORAL</span>
                        <strong style={{ color: '#eae7df', fontSize: 12 }}>VERIFIED 3/3</strong>
                      </div>
                    </div>

                    <button className="apex-create-incident-btn" onClick={handleCreateIncidentRecord}>
                      <span>+ CREATE INCIDENT RECORD</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* TAB 3: INCIDENT MANAGEMENT / HISTORY                         */}
          {/* ═════════════════════════════════════════════════════════════ */}
          {activeTab === 'incidents' && (
            <div className="apex-incidents-grid">
              {/* Left Column: List */}
              <div className="apex-panel" style={{ padding: '16px 20px' }}>
                <div className="apex-panel-header" style={{ marginBottom: 14 }}>
                  <span className="apex-panel-title">INCIDENT HISTORY</span>
                  <span className="apex-tag-badge">{filteredIncidents.length} RECORDS</span>
                </div>

                {/* Filter and Search Bar */}
                <div className="apex-filter-bar">
                  <div style={{ position: 'relative', flex: 1 }}>
                    <input
                      type="text"
                      className="apex-search-input"
                      placeholder="Search ID, type, location..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{ width: '100%', boxSizing: 'border-box' }}
                    />
                  </div>
                  <select
                    className="apex-select-pill"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="ALL">ALL STATUSES</option>
                    <option value="UNACKNOWLEDGED">UNACKNOWLEDGED</option>
                    <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
                    <option value="RESOLVED">RESOLVED</option>
                  </select>
                </div>

                {/* Incidents List */}
                <div className="apex-incidents-list">
                  {filteredIncidents.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--apex-text-muted)', fontSize: 13 }}>
                      No incidents match the current filter.
                    </div>
                  ) : (
                    filteredIncidents.map((inc) => {
                      const isSelected = selectedIncident?.id === inc.id;
                      return (
                        <div
                          key={inc.id}
                          className={`apex-incident-card ${isSelected ? 'selected' : ''}`}
                          data-severity={inc.severity}
                          onClick={() => setSelectedIncidentId(inc.id)}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                              <span
                                style={{
                                  fontFamily: 'JetBrains Mono, monospace',
                                  fontSize: 10,
                                  fontWeight: 700,
                                  color: inc.type === 'FIRE' ? '#fb4934' : inc.type === 'SMOKE' ? '#fabd2f' : '#83a598',
                                  background: inc.type === 'FIRE' ? 'rgba(251, 73, 52, 0.15)' : inc.type === 'SMOKE' ? 'rgba(250, 189, 47, 0.15)' : 'rgba(131, 165, 152, 0.15)',
                                  padding: '1px 6px',
                                  borderRadius: 3,
                                }}
                              >
                                {inc.type}
                              </span>
                              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700, color: '#f5f4ed' }}>
                                {inc.id}
                              </span>
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--apex-text-muted)' }}>
                              {inc.location}
                            </div>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <span
                              className={`apex-inc-status-badge ${inc.status.toLowerCase()}`}
                            >
                              {inc.status}
                            </span>
                            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--apex-text-dim)', marginTop: 4 }}>
                              {inc.created}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Column: Incident Record Details */}
              {selectedIncident ? (
                <div className="apex-panel">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--apex-border-dim)', paddingBottom: 14, marginBottom: 16 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#eae7df' }}>{selectedIncident.location}</div>
                      <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#4ade80', background: 'rgba(74, 222, 128, 0.1)', padding: '1px 6px', borderRadius: 3 }}>
                          OPEN
                        </span>
                        <span className={`apex-inc-status-badge ${selectedIncident.status.toLowerCase()}`}>
                          {selectedIncident.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Incident Title */}
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--apex-text-muted)', marginBottom: 2 }}>
                    INCIDENT RECORD
                  </div>
                  <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 26, fontStyle: 'italic', fontWeight: 400, color: '#f7f5ed', margin: '0 0 16px 0' }}>
                    {selectedIncident.id}
                  </h2>

                  {/* Metadata Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, fontFamily: 'JetBrains Mono, monospace', fontSize: 11, marginBottom: 18, background: 'var(--apex-bg-surface-alt)', padding: 14, borderRadius: 6, border: '1px solid var(--apex-border-dim)' }}>
                    <div>
                      <span style={{ color: 'var(--apex-text-muted)', display: 'block', fontSize: 10 }}>SEVERITY</span>
                      <strong style={{ color: selectedIncident.severity === 'HIGH' || selectedIncident.severity === 'CRITICAL' ? '#fb4934' : '#fabd2f' }}>
                        {selectedIncident.severity}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--apex-text-muted)', display: 'block', fontSize: 10 }}>CONFIDENCE</span>
                      <strong style={{ color: '#eae7df' }}>{selectedIncident.confidence}%</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--apex-text-muted)', display: 'block', fontSize: 10 }}>CAMERA</span>
                      <strong style={{ color: '#eae7df' }}>{selectedIncident.camera}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--apex-text-muted)', display: 'block', fontSize: 10 }}>CREATED</span>
                      <strong style={{ color: '#eae7df' }}>{selectedIncident.created}</strong>
                    </div>
                  </div>

                  {/* Camera Frame Snapshot */}
                  <div style={{ position: 'relative', height: 180, borderRadius: 6, overflow: 'hidden', border: '1px solid var(--apex-border-dim)', marginBottom: 18, background: '#0e100f' }}>
                    <img
                      src={selectedIncident.image || '/cctv/surveillance_dock.jpg'}
                      alt="Incident Snapshot"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div className="apex-scanlines" />
                    <div
                      style={{
                        position: 'absolute',
                        top: '20%',
                        left: '25%',
                        width: '45%',
                        height: '50%',
                        border: '2px solid #fb4934',
                        boxShadow: '0 0 8px rgba(251, 73, 52, 0.4)',
                      }}
                    >
                      <span
                        style={{
                          position: 'absolute',
                          top: -18,
                          left: -2,
                          background: '#fb4934',
                          color: '#fff',
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: 9,
                          fontWeight: 700,
                          padding: '1px 6px',
                        }}
                      >
                        {selectedIncident.type} · {selectedIncident.confidence}%
                      </span>
                    </div>
                  </div>

                  {/* Operator Notes */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--apex-text-muted)', marginBottom: 4 }}>
                      OPERATOR NOTES
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--apex-text-secondary)', marginBottom: 8, fontStyle: 'italic' }}>
                      {selectedIncident.operatorNote}
                    </div>
                    <textarea
                      value={operatorNoteInput}
                      onChange={(e) => setOperatorNoteInput(e.target.value)}
                      placeholder="Add dispatch or resolution note..."
                      rows={3}
                      style={{
                        width: '100%',
                        background: 'var(--apex-bg-surface-alt)',
                        border: '1px solid var(--apex-border)',
                        borderRadius: 6,
                        padding: '8px 10px',
                        color: '#eae7df',
                        fontFamily: 'Manrope, sans-serif',
                        fontSize: 12,
                        outline: 'none',
                        resize: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  {/* View Building Dashboard Button */}
                  {selectedIncident.building_id && (
                    <button 
                      className="apex-ack-btn" 
                      onClick={() => handleViewBuildingDashboard(selectedIncident)}
                      style={{ 
                        background: 'rgba(139, 92, 246, 0.2)', 
                        borderColor: '#a78bfa', 
                        color: '#c4b5fd',
                        marginBottom: '12px'
                      }}
                    >
                      <span>VIEW BUILDING DASHBOARD</span>
                      <ArrowRight size={14} />
                    </button>
                  )}

                  {/* Action CTA Button */}
                  {selectedIncident.status === 'UNACKNOWLEDGED' && (
                    <button className="apex-ack-btn" onClick={handleAcknowledge}>
                      <span>ACKNOWLEDGE INCIDENT</span>
                      <ArrowRight size={14} />
                    </button>
                  )}

                  {selectedIncident.status === 'ACKNOWLEDGED' && (
                    <button
                      className="apex-ack-btn"
                      onClick={handleResolve}
                      style={{ background: '#38bdf8', borderColor: '#7dd3fc', color: '#0b1f2b' }}
                    >
                      <span>RESOLVE INCIDENT</span>
                      <Check size={14} />
                    </button>
                  )}

                  {selectedIncident.status === 'RESOLVED' && (
                    <div
                      style={{
                        padding: '10px 14px',
                        background: 'rgba(74, 222, 128, 0.1)',
                        border: '1px solid rgba(74, 222, 128, 0.3)',
                        borderRadius: 6,
                        color: '#4ade80',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: 11,
                        fontWeight: 700,
                        textAlign: 'center',
                      }}
                    >
                      ✓ INCIDENT RESOLVED AND LOGGED
                    </div>
                  )}
                </div>
              ) : (
                <div className="apex-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--apex-text-muted)' }}>
                  Select an incident to view details
                </div>
              )}
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* TAB 4: ADD ORGANIZATION                                       */}
          {/* ═════════════════════════════════════════════════════════════ */}
          {activeTab === 'add-organization' && (
            <AddOrganization onBack={() => setActiveTab('overview')} />
          )}

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* TAB 5: ADD BUILDING                                           */}
          {/* ═════════════════════════════════════════════════════════════ */}
          {activeTab === 'add-building' && (
            <AddBuilding onBack={() => setActiveTab('overview')} />
          )}

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* TAB 6: BUILDING DETAIL                                        */}
          {/* ═════════════════════════════════════════════════════════════ */}
          {activeTab === 'building-detail' && (
            <BuildingDetail 
              building={selectedBuilding} 
              onBack={() => {
                setActiveTab('overview');
                setActiveIncidentForBuilding(null); // Clear incident when going back
              }}
              activeIncidentId={activeIncidentForBuilding}
              onVerifyIncident={verifyAlert}
            />
          )}
        </div>
      </main>

      {/* ─── TIMER DEBUG PANEL (Bottom-Left) ─── */}
      <TimerDebugPanel activeAlerts={activeAlerts} />
    </div>
  );
}
