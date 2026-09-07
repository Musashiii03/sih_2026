/**
 * useFireAlerts Hook
 * 
 * Polls for active fire alerts and manages alert state with countdown timers
 * Tracks seen incidents to detect new alerts in real-time
 * Provides functions to acknowledge and dismiss alerts
 */

import { useState, useEffect, useCallback, useRef } from 'react';

const API_BASE_URL = 'http://localhost:3001/api';
const POLL_INTERVAL = 5000; // 5 seconds
const ALERT_DURATION = 45; // 45 seconds

/**
 * Fetch active fire alerts from backend
 */
async function fetchActiveAlerts() {
  try {
    const response = await fetch(`${API_BASE_URL}/incidents/active-alerts`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error('Error fetching active alerts:', error);
    return [];
  }
}

/**
 * Update incident status via API
 */
async function updateIncidentStatus(incidentId, status, notes = '') {
  try {
    console.log(`📡 Sending PATCH request to update incident ${incidentId} to ${status}`);
    
    const response = await fetch(`${API_BASE_URL}/incidents/${incidentId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status, notes })
    });
    
    console.log(`📡 Response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ HTTP Error ${response.status}:`, errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    console.log(`✅ Update response:`, data);
    return data.success;
  } catch (error) {
    console.error('❌ Error updating incident status:', error.message);
    return false;
  }
}

/**
 * Main hook for managing fire alerts
 */
export function useFireAlerts() {
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [seenIncidentIds, setSeenIncidentIds] = useState(new Set());
  const [buildingsWithAlerts, setBuildingsWithAlerts] = useState(new Set());
  const timerIntervals = useRef({});
  const activeAlertsRef = useRef([]); // Keep a ref for synchronous access
  
  // Update ref whenever state changes
  useEffect(() => {
    activeAlertsRef.current = activeAlerts;
  }, [activeAlerts]);

  /**
   * Process new alerts from API response
   */
  const processAlerts = useCallback((fetchedAlerts) => {
    console.log('🔄 Processing alerts from API:', fetchedAlerts);
    
    const now = Date.now();
    
    fetchedAlerts.forEach(alert => {
      console.log('  Checking alert:', alert.incident_number, 'Seen:', seenIncidentIds.has(alert.incident_number));
      
      // Check if this is a new alert we haven't seen before
      if (!seenIncidentIds.has(alert.incident_number)) {
        console.log(`🚨 NEW FIRE ALERT DETECTED: ${alert.incident_number} at ${alert.building_name}`);
        
        // Mark as seen
        setSeenIncidentIds(prev => {
          const next = new Set([...prev, alert.incident_number]);
          console.log('  Updated seen IDs:', Array.from(next));
          return next;
        });
        
        // Add to active alerts with timer
        setActiveAlerts(prev => {
          // Don't add if already exists
          if (prev.some(a => a.incident_number === alert.incident_number)) {
            console.log('  Alert already in activeAlerts, skipping');
            return prev;
          }
          
          const newAlert = {
            ...alert,
            timeRemaining: ALERT_DURATION,
            startTime: now,
            escalated: false,
            dismissed: false
          };
          
          console.log('  Adding alert to activeAlerts:', newAlert);
          return [...prev, newAlert];
        });
        
        // Track building with alert
        setBuildingsWithAlerts(prev => {
          const next = new Set([...prev, alert.building_id]);
          console.log('  Buildings with alerts:', Array.from(next));
          return next;
        });
      }
    });
  }, [seenIncidentIds]);

  /**
   * Load alerts from API
   */
  const loadAlerts = useCallback(async () => {
    const fetchedAlerts = await fetchActiveAlerts();
    processAlerts(fetchedAlerts);
  }, [processAlerts]);

  /**
   * Acknowledge an alert (navigate to building but keep alert active)
   */
  const acknowledgeAlert = useCallback(async (incidentNumber) => {
    console.log(`✓ ACKNOWLEDGING ALERT: ${incidentNumber} - keeping alert active`);
    console.log('Current active alerts from ref:', activeAlertsRef.current);
    
    // Find the alert using the ref for synchronous access
    const foundAlert = activeAlertsRef.current.find(a => a.incident_number === incidentNumber);
    
    console.log('Found alert:', foundAlert);
    
    if (!foundAlert) {
      console.error(`❌ Alert ${incidentNumber} not found in active alerts`);
      return { success: false, alert: null, error: 'Alert not found' };
    }
    
    console.log(`📋 Alert will remain active until verified or timer expires`);
    
    // DO NOT remove the alert - it stays active until:
    // 1. User manually verifies in building dashboard, OR
    // 2. 45-second timer expires
    
    // Just mark it as viewed so we know user has seen it
    setActiveAlerts(prev => prev.map(a => 
      a.incident_number === incidentNumber 
        ? { ...a, viewed: true }
        : a
    ));
    
    console.log(`✓ Alert ${incidentNumber} marked as viewed (still active)`);
    return { success: true, alert: foundAlert };
  }, []);

  /**
   * Dismiss an alert without acknowledging (for testing)
   */
  const dismissAlert = useCallback((incidentNumber) => {
    console.log(`✕ DISMISSING ALERT: ${incidentNumber}`);
    
    setActiveAlerts(prev => {
      const alert = prev.find(a => a.incident_number === incidentNumber);
      if (alert) {
        // Mark as dismissed instead of removing
        return prev.map(a => 
          a.incident_number === incidentNumber 
            ? { ...a, dismissed: true }
            : a
        );
      }
      return prev;
    });
    
    // Clear timer
    if (timerIntervals.current[incidentNumber]) {
      clearInterval(timerIntervals.current[incidentNumber]);
      delete timerIntervals.current[incidentNumber];
    }
  }, []);

  /**
   * Verify an alert (remove from active alerts after verification)
   */
  const verifyAlert = useCallback((incidentNumber) => {
    console.log(`✅ VERIFYING ALERT: ${incidentNumber}`);
    
    // Remove from active alerts completely
    setActiveAlerts(prev => {
      const alert = prev.find(a => a.incident_number === incidentNumber);
      
      if (alert) {
        // Update buildings with alerts
        const remainingAlertsForBuilding = prev.filter(
          a => a.building_id === alert.building_id && a.incident_number !== incidentNumber
        );
        
        if (remainingAlertsForBuilding.length === 0) {
          setBuildingsWithAlerts(prevBuildings => {
            const next = new Set(prevBuildings);
            next.delete(alert.building_id);
            return next;
          });
        }
      }
      
      return prev.filter(a => a.incident_number !== incidentNumber);
    });
    
    // Clear timer if exists
    if (timerIntervals.current[incidentNumber]) {
      clearInterval(timerIntervals.current[incidentNumber]);
      delete timerIntervals.current[incidentNumber];
    }
    
    console.log(`✓ Alert ${incidentNumber} removed from active alerts`);
  }, []);

  /**
   * Handle timer expiration (auto-escalation)
   */
  const handleTimerExpired = useCallback((incidentNumber) => {
    console.log(`⏰ TIMER EXPIRED for ${incidentNumber}`);
    console.log(`🚨 AUTO-ESCALATION: Would contact fire department for incident ${incidentNumber}`);
    console.log(`TODO: Integrate with ERSS 112 dispatch system`);
    
    setActiveAlerts(prev => 
      prev.map(a => 
        a.incident_number === incidentNumber 
          ? { ...a, escalated: true, timeRemaining: 0 }
          : a
      )
    );
    
    // Clear interval
    if (timerIntervals.current[incidentNumber]) {
      clearInterval(timerIntervals.current[incidentNumber]);
      delete timerIntervals.current[incidentNumber];
    }
  }, []);

  /**
   * Update countdown timers every second
   */
  useEffect(() => {
    activeAlerts.forEach(alert => {
      // Skip if already escalated or dismissed
      if (alert.escalated || alert.dismissed) return;
      
      // Create timer if doesn't exist
      if (!timerIntervals.current[alert.incident_number]) {
        console.log(`⏱️ Starting countdown timer for ${alert.incident_number}`);
        
        timerIntervals.current[alert.incident_number] = setInterval(() => {
          setActiveAlerts(prev => {
            return prev.map(a => {
              if (a.incident_number === alert.incident_number && !a.escalated && !a.dismissed) {
                const elapsed = Math.floor((Date.now() - a.startTime) / 1000);
                const remaining = Math.max(0, ALERT_DURATION - elapsed);
                
                // Check if timer expired
                if (remaining === 0 && !a.escalated) {
                  // Trigger escalation
                  setTimeout(() => handleTimerExpired(alert.incident_number), 0);
                }
                
                return { ...a, timeRemaining: remaining };
              }
              return a;
            });
          });
        }, 1000);
      }
    });
    
    // Cleanup intervals for alerts that are no longer active
    return () => {
      Object.keys(timerIntervals.current).forEach(incidentNumber => {
        if (!activeAlerts.some(a => a.incident_number === incidentNumber)) {
          clearInterval(timerIntervals.current[incidentNumber]);
          delete timerIntervals.current[incidentNumber];
        }
      });
    };
  }, [activeAlerts, handleTimerExpired]);

  /**
   * Poll for new alerts every 5 seconds
   */
  useEffect(() => {
    console.log('🔄 Starting fire alerts polling...');
    
    // Initial load
    loadAlerts();
    
    // Set up polling
    const pollTimer = setInterval(() => {
      loadAlerts();
    }, POLL_INTERVAL);
    
    return () => {
      console.log('🛑 Stopping fire alerts polling');
      clearInterval(pollTimer);
      
      // Clear all countdown timers
      Object.values(timerIntervals.current).forEach(interval => clearInterval(interval));
      timerIntervals.current = {};
    };
  }, [loadAlerts]);

  return {
    activeAlerts: activeAlerts.filter(a => !a.dismissed), // Don't show dismissed alerts
    acknowledgeAlert,
    dismissAlert,
    verifyAlert,
    buildingsWithAlerts: Array.from(buildingsWithAlerts),
    alertCount: activeAlerts.filter(a => !a.dismissed).length,
    // Debug info
    _allAlerts: activeAlerts, // Include all alerts for debugging
    _seenIncidentIds: Array.from(seenIncidentIds)
  };
}
