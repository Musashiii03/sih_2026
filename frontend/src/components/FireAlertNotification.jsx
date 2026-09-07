/**
 * FireAlertNotification Component
 * 
 * Slide-in alert notification for fire incidents
 * Shows building name, fire status, countdown timer, and acknowledge button
 * Non-blocking design that slides in from top-right corner
 */

import React from 'react';
import { Flame, CheckCircle, Clock } from 'lucide-react';
import './FireAlertNotification.css';

export default function FireAlertNotification({ alert, onAcknowledge, onDismiss }) {
  if (!alert) return null;

  const { 
    incident_number, 
    building_name, 
    building_code,
    severity, 
    timeRemaining, 
    escalated,
    confidence_score,
    camera_location
  } = alert;

  // Debug: Log only when timeRemaining changes significantly (every 5 seconds)
  if (timeRemaining % 5 === 0 || timeRemaining <= 5) {
    console.log(`🔔 Alert ${incident_number}: ${timeRemaining}s, escalated=${escalated}`);
  }

  // Format time remaining as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Determine alert state styling
  const isUrgent = timeRemaining <= 10 && !escalated;
  const isEscalated = escalated;

  const handleAcknowledge = () => {
    console.log('🔔 FireAlertNotification: Acknowledge clicked');
    console.log('   Incident Number:', incident_number);
    console.log('   Full Alert Object:', alert);
    if (onAcknowledge) {
      onAcknowledge(incident_number);
    }
  };

  const handleDismiss = () => {
    console.log('✕ FireAlertNotification: Dismiss clicked');
    console.log('   Incident Number:', incident_number);
    if (onDismiss) {
      onDismiss(incident_number);
    }
  };

  return (
    <div 
      className={`fire-alert-notification ${isUrgent ? 'urgent' : ''} ${isEscalated ? 'escalated' : ''}`}
      role="alert"
      aria-live="assertive"
    >
      {/* Fire Icon */}
      <div className="fire-alert-icon">
        <Flame size={24} className="fire-icon-flame" />
      </div>

      {/* Alert Content */}
      <div className="fire-alert-content">
        {/* Status Header */}
        <div className="fire-alert-header">
          <span className="fire-alert-status">
            {isEscalated ? '🚨 AUTO-ESCALATED' : '🔥 FIRE DETECTED'}
          </span>
          <span className="fire-alert-incident-id">{incident_number}</span>
        </div>

        {/* Building Name */}
        <div className="fire-alert-building">
          <strong>{building_name}</strong>
          {building_code && <span className="building-code">({building_code})</span>}
        </div>

        {/* Additional Info */}
        <div className="fire-alert-details">
          {camera_location && (
            <div className="alert-detail-item">
              📍 {camera_location}
            </div>
          )}
          {confidence_score && (
            <div className="alert-detail-item">
              Confidence: {(confidence_score * 100).toFixed(1)}%
            </div>
          )}
        </div>

        {/* Timer Display */}
        <div className="fire-alert-timer">
          <Clock size={14} />
          <span className="timer-text">
            {isEscalated 
              ? 'Fire department notified' 
              : `Acknowledge in ${formatTime(timeRemaining)}`
            }
          </span>
        </div>

        {/* Action Buttons */}
        <div className="fire-alert-actions">
          {!isEscalated ? (
            <>
              <button 
                className="fire-alert-btn-acknowledge"
                onClick={handleAcknowledge}
              >
                <CheckCircle size={16} />
                <span>Acknowledge & View</span>
              </button>
              <button 
                className="fire-alert-btn-dismiss"
                onClick={handleDismiss}
                title="Dismiss notification (for testing)"
              >
                ✕
              </button>
            </>
          ) : (
            <button 
              className="fire-alert-btn-escalated"
              onClick={handleDismiss}
            >
              Dismiss
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {!isEscalated && (
        <div className="fire-alert-progress-bar">
          <div 
            className="fire-alert-progress-fill"
            style={{ 
              width: `${(timeRemaining / 45) * 100}%`,
              transition: 'width 1s linear'
            }}
          />
        </div>
      )}
    </div>
  );
}
