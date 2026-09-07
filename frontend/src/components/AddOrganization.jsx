/**
 * AddOrganization Component
 * Form to add a new organization to the database
 */

import React, { useState } from 'react';
import { ArrowLeft, Save, Building2 } from 'lucide-react';
import './AddOrganization.css';

export default function AddOrganization({ onBack }) {
  const [formData, setFormData] = useState({
    name: '',
    organization_type: 'CORPORATE',
    registration_number: '',
    email: '',
    phone: '',
    status: 'ACTIVE'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        setMessage({ type: 'success', text: 'Organization created successfully!' });
        // Reset form after 2 seconds
        setTimeout(() => {
          setFormData({
            name: '',
            organization_type: 'CORPORATE',
            registration_number: '',
            email: '',
            phone: '',
            status: 'ACTIVE'
          });
          setMessage({ type: '', text: '' });
        }, 2000);
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.message || 'Failed to create organization' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="add-org-container">
      {/* Header */}
      <div className="add-org-header">
        <button className="back-btn" onClick={onBack}>
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>
        <div className="add-org-title-section">
          <div className="add-org-icon">
            <Building2 size={24} />
          </div>
          <div>
            <h1 className="add-org-title">Add New Organization</h1>
            <p className="add-org-subtitle">Register a new organization in the system</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form className="add-org-form" onSubmit={handleSubmit}>
        {/* Message Display */}
        {message.text && (
          <div className={`form-message ${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="form-grid">
          {/* Organization Name */}
          <div className="form-group full-width">
            <label className="form-label" htmlFor="name">
              Organization Name <span className="required">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              className="form-input"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter organization name"
              maxLength={200}
            />
          </div>

          {/* Organization Type */}
          <div className="form-group">
            <label className="form-label" htmlFor="organization_type">
              Organization Type <span className="required">*</span>
            </label>
            <select
              id="organization_type"
              name="organization_type"
              className="form-select"
              value={formData.organization_type}
              onChange={handleChange}
              required
            >
              <option value="CORPORATE">Corporate</option>
              <option value="GOVERNMENT">Government</option>
              <option value="NGO">NGO</option>
              <option value="EDUCATIONAL">Educational</option>
            </select>
          </div>

          {/* Status */}
          <div className="form-group">
            <label className="form-label" htmlFor="status">
              Status <span className="required">*</span>
            </label>
            <select
              id="status"
              name="status"
              className="form-select"
              value={formData.status}
              onChange={handleChange}
              required
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>

          {/* Registration Number */}
          <div className="form-group">
            <label className="form-label" htmlFor="registration_number">
              Registration Number
            </label>
            <input
              type="text"
              id="registration_number"
              name="registration_number"
              className="form-input"
              value={formData.registration_number}
              onChange={handleChange}
              placeholder="Enter registration number (optional)"
              maxLength={100}
            />
            <span className="form-hint">Must be unique if provided</span>
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="form-input"
              value={formData.email}
              onChange={handleChange}
              placeholder="organization@example.com"
              maxLength={255}
            />
          </div>

          {/* Phone */}
          <div className="form-group">
            <label className="form-label" htmlFor="phone">
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              className="form-input"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+1 (555) 123-4567"
              maxLength={20}
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="form-actions">
          <button
            type="submit"
            className="submit-btn"
            disabled={isSubmitting}
          >
            <Save size={20} />
            <span>{isSubmitting ? 'Saving...' : 'Save Organization'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
