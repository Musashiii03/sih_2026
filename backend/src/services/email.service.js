/**
 * Email Service
 * 
 * Handles sending emails via SMTP (nodemailer)
 * Used for fire department notifications
 */

const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initialized = false;
    this.initTransporter();
  }

  /**
   * Initialize SMTP transporter
   */
  initTransporter() {
    try {
      const config = {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD
        }
      };

      // Only initialize if credentials are provided
      if (config.auth.user && config.auth.pass) {
        this.transporter = nodemailer.createTransport(config);
        this.initialized = true;
        console.log('✅ Email service initialized');
      } else {
        console.warn('⚠️  Email service not initialized - missing SMTP credentials');
      }
    } catch (error) {
      console.error('❌ Error initializing email service:', error.message);
      this.initialized = false;
    }
  }

  /**
   * Send email to fire department about critical alert
   * 
   * @param {Object} incidentData - Incident data
   * @param {Object} buildingData - Building data including address
   * @param {string} dashboardUrl - URL to dispatch dashboard
   */
  async sendFireDepartmentAlert(incidentData, buildingData, dashboardUrl) {
    if (!this.initialized) {
      console.warn('⚠️  Email service not initialized - skipping email');
      return { success: false, error: 'Email service not configured' };
    }

    try {
      const fireDeptEmail = process.env.FIRE_DEPARTMENT_EMAIL;
      
      if (!fireDeptEmail) {
        console.warn('⚠️  FIRE_DEPARTMENT_EMAIL not configured');
        return { success: false, error: 'Fire department email not configured' };
      }

      // Build building address string
      let buildingAddress = 'Address not available';
      if (buildingData.address) {
        const addr = buildingData.address;
        buildingAddress = [
          addr.address_line_1,
          addr.address_line_2,
          addr.locality,
          addr.city,
          addr.district,
          addr.state,
          addr.postal_code
        ].filter(Boolean).join(', ');
      }

      // Check if this is auto-escalation
      const isAutoEscalation = incidentData.escalation_type === 'AUTO_ESCALATED';
      const escalationReason = incidentData.escalation_reason || 'No owner response within 45 seconds';

      // Build fire station info if available
      let fireStationInfo = '';
      if (buildingData.nearest_fire_station) {
        const station = buildingData.nearest_fire_station;
        const distance = buildingData.fire_station_distance_km;
        fireStationInfo = `
<h3 style="color: #2563eb; margin-top: 20px;">Nearest Fire Station</h3>
<p><strong>Station:</strong> ${station.fire_station_name || 'N/A'}</p>
${station.address_line_1 ? `<p><strong>Location:</strong> ${station.address_line_1}</p>` : ''}
${distance ? `<p><strong>Distance:</strong> ${typeof distance === 'number' ? distance.toFixed(2) : distance} km</p>` : ''}
${station.phone ? `<p><strong>Phone:</strong> ${station.phone}</p>` : ''}
`;
      }

      // Build building safety features
      const safetyFeatures = [];
      if (buildingData.has_fire_alarm) safetyFeatures.push('Fire Alarm System');
      if (buildingData.has_sprinkler) safetyFeatures.push('Sprinkler System');
      if (buildingData.has_fire_extinguishers) safetyFeatures.push('Fire Extinguishers');
      
      const safetyFeaturesHtml = safetyFeatures.length > 0 
        ? `<p><strong>Safety Features:</strong> ${safetyFeatures.join(', ')}</p>`
        : '';

      // Build email subject
      const areaName = buildingData.address?.locality || buildingData.address?.city || 'Unknown Area';
      const subject = isAutoEscalation 
        ? `🚨 URGENT: Auto-Escalated Fire Alert in ${areaName} - NO OWNER RESPONSE`
        : `🚨 Critical Alert: Fire Detected in ${areaName}`;

      // Build email HTML body
      const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
    .alert-badge { background: #dc2626; color: white; padding: 4px 12px; border-radius: 4px; font-weight: bold; display: inline-block; }
    .btn { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: bold; }
    .info-section { background: white; padding: 15px; margin: 15px 0; border-radius: 6px; border-left: 4px solid #dc2626; }
    h2 { margin: 0 0 10px 0; }
    h3 { color: #dc2626; margin-top: 20px; }
    .footer { margin-top: 20px; padding-top: 20px; border-top: 2px solid #e5e7eb; font-size: 12px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>🚨 CRITICAL FIRE ALERT</h2>
      <p style="margin: 0; font-size: 14px;">Incident: ${incidentData.incident_number}</p>
    </div>
    
    <div class="content">
      <div class="info-section">
        <p><span class="alert-badge">${incidentData.severity}</span> Priority Alert</p>
        ${isAutoEscalation ? `
        <p style="color: #dc2626; font-weight: bold; font-size: 16px;">
          ⚠️ AUTO-ESCALATED - ${escalationReason}
        </p>
        ` : `
        <p><strong>Status:</strong> Owner acknowledged within 45 seconds - Automatic escalation</p>
        `}
        <p><strong>Detected:</strong> ${new Date(incidentData.detected_at).toLocaleString('en-US', { 
          dateStyle: 'full', 
          timeStyle: 'long' 
        })}</p>
        <p><strong>Confidence:</strong> ${(incidentData.confidence_score * 100).toFixed(1)}%</p>
      </div>

      <h3 style="color: #dc2626;">Building Details</h3>
      <p><strong>Name:</strong> ${buildingData.name}</p>
      ${buildingData.building_type ? `<p><strong>Type:</strong> ${buildingData.building_type}</p>` : ''}
      <p><strong>Address:</strong> ${buildingAddress}</p>
      ${buildingData.number_of_floors ? `<p><strong>Floors:</strong> ${buildingData.number_of_floors}</p>` : ''}
      ${buildingData.total_area ? `<p><strong>Total Area:</strong> ${buildingData.total_area} sq.m</p>` : ''}
      ${buildingData.height ? `<p><strong>Height:</strong> ${buildingData.height} m</p>` : ''}
      ${safetyFeaturesHtml}

      ${fireStationInfo}

      <div style="text-align: center; margin: 30px 0;">
        <a href="${dashboardUrl}" class="btn">VIEW DISPATCH DASHBOARD</a>
      </div>

      <div style="background: #fef3c7; border: 1px solid #fbbf24; padding: 15px; border-radius: 6px; margin-top: 20px;">
        ${isAutoEscalation ? `
        <p style="margin: 0;"><strong>🚨 URGENT ACTION REQUIRED:</strong> This incident was automatically escalated after the 45-second timer expired without owner acknowledgment. The building owner has NOT responded to the alert. Immediate dispatch and response recommended.</p>
        ` : `
        <p style="margin: 0;"><strong>⚠️ Action Required:</strong> This incident has been acknowledged by the building owner within 45 seconds. Please review the dispatch dashboard for real-time information and coordinate response.</p>
        `}
      </div>
    </div>

    <div class="footer">
      <p>This is an automated alert from Atmarakshak Fire Detection System</p>
      <p>For technical support, contact: support@atmarakshak.com</p>
    </div>
  </div>
</body>
</html>
`;

      // Send email
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'Atmarakshak Fire Alert <alerts@atmarakshak.com>',
        to: fireDeptEmail,
        subject: subject,
        html: htmlBody,
        priority: 'high',
        headers: {
          'X-Priority': '1',
          'X-MSMail-Priority': 'High',
          'Importance': 'high'
        }
      };

      console.log(`📧 Sending fire department alert email to ${fireDeptEmail}...`);
      const info = await this.transporter.sendMail(mailOptions);
      
      console.log('✅ Email sent successfully:', info.messageId);
      return { 
        success: true, 
        messageId: info.messageId,
        recipient: fireDeptEmail
      };

    } catch (error) {
      console.error('❌ Error sending email:', error.message);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  /**
   * Test email configuration
   */
  async testConnection() {
    if (!this.initialized) {
      return { success: false, error: 'Email service not initialized' };
    }

    try {
      await this.transporter.verify();
      console.log('✅ SMTP connection verified');
      return { success: true };
    } catch (error) {
      console.error('❌ SMTP connection failed:', error.message);
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
module.exports = new EmailService();
