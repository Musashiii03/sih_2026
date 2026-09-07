/**
 * Timer Debug Panel
 * Shows real-time timer status for debugging
 */

import React from 'react';

export default function TimerDebugPanel({ activeAlerts }) {
  if (!activeAlerts || activeAlerts.length === 0) {
    return (
      <div style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        background: '#1a1a1a',
        color: '#00ff00',
        padding: '15px',
        borderRadius: '8px',
        fontFamily: 'monospace',
        fontSize: '12px',
        zIndex: 9999,
        border: '2px solid #00ff00',
        minWidth: '300px'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>⏱️ TIMER DEBUG PANEL</div>
        <div>No active alerts</div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '20px',
      background: '#1a1a1a',
      color: '#00ff00',
      padding: '15px',
      borderRadius: '8px',
      fontFamily: 'monospace',
      fontSize: '12px',
      zIndex: 9999,
      border: '2px solid #00ff00',
      minWidth: '300px',
      maxHeight: '400px',
      overflow: 'auto'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#ffff00' }}>
        ⏱️ TIMER DEBUG PANEL ({activeAlerts.length})
      </div>
      {activeAlerts.map((alert, index) => {
        const progress = (alert.timeRemaining / 45) * 100;
        const color = alert.escalated ? '#ff0000' : 
                     alert.timeRemaining <= 10 ? '#ff6600' : 
                     '#00ff00';
        
        return (
          <div key={alert.incident_number} style={{ 
            marginBottom: '15px',
            padding: '10px',
            background: 'rgba(0,0,0,0.5)',
            borderRadius: '4px',
            borderLeft: `4px solid ${color}`
          }}>
            <div style={{ fontWeight: 'bold', color: color }}>
              Alert #{index + 1}: {alert.incident_number}
            </div>
            <div style={{ marginTop: '5px' }}>
              Building: {alert.building_name}
            </div>
            <div style={{ marginTop: '5px', fontSize: '16px', fontWeight: 'bold', color: color }}>
              Time: {Math.floor(alert.timeRemaining / 60)}:{(alert.timeRemaining % 60).toString().padStart(2, '0')}
            </div>
            <div style={{ 
              marginTop: '5px', 
              height: '8px', 
              background: '#333',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: `${progress}%`,
                background: color,
                transition: 'width 1s linear'
              }} />
            </div>
            <div style={{ marginTop: '5px', fontSize: '10px' }}>
              Escalated: {alert.escalated ? '✅ YES' : '❌ NO'}
            </div>
            <div style={{ fontSize: '10px' }}>
              Dismissed: {alert.dismissed ? '✅ YES' : '❌ NO'}
            </div>
            <div style={{ fontSize: '10px' }}>
              Start: {new Date(alert.startTime).toLocaleTimeString()}
            </div>
          </div>
        );
      })}
      <div style={{ 
        marginTop: '10px', 
        paddingTop: '10px', 
        borderTop: '1px solid #333',
        fontSize: '10px',
        color: '#888'
      }}>
        Updated every second • Open console (F12) for detailed logs
      </div>
    </div>
  );
}
