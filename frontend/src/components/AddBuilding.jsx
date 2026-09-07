/**
 * AddBuilding Component
 * Form to add a new building to the database
 */

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Building } from 'lucide-react';
import './AddBuilding.css';

export default function AddBuilding({ onBack }) {
  const [organizations, setOrganizations] = useState([]);
  const [formData, setFormData] = useState({
    building_code: '',
    name: '',
    building_type: 'OFFICE',
    organization_id: '',
    number_of_floors: '',
    number_of_units: '',
    construction_year: '',
    total_area: '',
    height: '',
    occupancy_type: 'COMMERCIAL',
    has_fire_alarm: false,
    has_sprinkler: false,
    has_fire_extinguishers: false,
    has_fire_exit: false,
    has_fire_hydrant: false,
    status: 'ACTIVE'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Fetch organizations on component mount
  useEffect(() => {
    fetchOrganizations();
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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      // Prepare data - convert empty strings to null for optional numeric fields
      const submitData = {
        ...formData,
        organization_id: formData.organization_id ? parseInt(formData.organization_id) : null,
        number_of_floors: parseInt(formData.number_of_floors),
        number_of_units: parseInt(formData.number_of_units),
        construction_year: formData.construction_year ? parseInt(formData.construction_year) : null,
        total_area: formData.total_area ? parseFloat(formData.total_area) : null,
        height: formData.height ? parseFloat(formData.height) : null,
        // address_id is optional — omit rather than hardcode a non-existent FK
      };
      delete submitData.address_id;

      const response = await fetch('/api/buildings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData)
      });

      if (response.ok) {
        const data = await response.json();
        setMessage({ type: 'success', text: 'Building created successfully!' });
        // Reset form after 2 seconds
        setTimeout(() => {
          setFormData({
            building_code: '',
            name: '',
            building_type: 'OFFICE',
            organization_id: '',
            number_of_floors: '',
            number_of_units: '',
            construction_year: '',
            total_area: '',
            height: '',
            occupancy_type: 'COMMERCIAL',
            has_fire_alarm: false,
            has_sprinkler: false,
            has_fire_extinguishers: false,
            has_fire_exit: false,
            has_fire_hydrant: false,
            status: 'ACTIVE'
          });
          setMessage({ type: '', text: '' });
        }, 2000);
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.message || 'Failed to create building' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="add-building-container">
      {/* Header */}
      <div className="add-building-header">
        <button className="back-btn" onClick={onBack}>
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>
        <div className="add-building-title-section">
          <div className="add-building-icon">
            <Building size={24} />
          </div>
          <div>
            <h1 className="add-building-title">Add New Building</h1>
            <p className="add-building-subtitle">Register a new building in the system</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form className="add-building-form" onSubmit={handleSubmit}>
        {/* Message Display */}
        {message.text && (
          <div className={`form-message ${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="form-grid">
          {/* Building Code */}
          <div className="form-group">
            <label className="form-label" htmlFor="building_code">
              Building Code <span className="required">*</span>
            </label>
            <input
              type="text"
              id="building_code"
              name="building_code"
              className="form-input"
              value={formData.building_code}
              onChange={handleChange}
              required
              placeholder="Enter unique building code"
              maxLength={50}
            />
          </div>

          {/* Building Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="name">
              Building Name <span className="required">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              className="form-input"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter building name"
              maxLength={200}
            />
          </div>

          {/* Building Type */}
          <div className="form-group">
            <label className="form-label" htmlFor="building_type">
              Building Type <span className="required">*</span>
            </label>
            <select
              id="building_type"
              name="building_type"
              className="form-select"
              value={formData.building_type}
              onChange={handleChange}
              required
            >
              <option value="RESIDENTIAL">Residential</option>
              <option value="APARTMENT">Apartment</option>
              <option value="OFFICE">Office</option>
              <option value="MALL">Mall</option>
              <option value="HOTEL">Hotel</option>
              <option value="HOSPITAL">Hospital</option>
              <option value="SCHOOL">School</option>
              <option value="WAREHOUSE">Warehouse</option>
              <option value="FACTORY">Factory</option>
              <option value="GOVERNMENT">Government</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          {/* Organization */}
          <div className="form-group">
            <label className="form-label" htmlFor="organization_id">
              Organization
            </label>
            <select
              id="organization_id"
              name="organization_id"
              className="form-select"
              value={formData.organization_id}
              onChange={handleChange}
            >
              <option value="">Select Organization (Optional)</option>
              {organizations.map(org => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>

          {/* Number of Floors */}
          <div className="form-group">
            <label className="form-label" htmlFor="number_of_floors">
              Number of Floors <span className="required">*</span>
            </label>
            <input
              type="number"
              id="number_of_floors"
              name="number_of_floors"
              className="form-input"
              value={formData.number_of_floors}
              onChange={handleChange}
              required
              min="1"
              placeholder="Enter number of floors"
            />
          </div>

          {/* Number of Units */}
          <div className="form-group">
            <label className="form-label" htmlFor="number_of_units">
              Number of Units <span className="required">*</span>
            </label>
            <input
              type="number"
              id="number_of_units"
              name="number_of_units"
              className="form-input"
              value={formData.number_of_units}
              onChange={handleChange}
              required
              min="1"
              placeholder="Enter number of units"
            />
          </div>

          {/* Construction Year */}
          <div className="form-group">
            <label className="form-label" htmlFor="construction_year">
              Construction Year
            </label>
            <input
              type="number"
              id="construction_year"
              name="construction_year"
              className="form-input"
              value={formData.construction_year}
              onChange={handleChange}
              min="1800"
              max={new Date().getFullYear()}
              placeholder="Enter year (optional)"
            />
          </div>

          {/* Total Area */}
          <div className="form-group">
            <label className="form-label" htmlFor="total_area">
              Total Area (m²)
            </label>
            <input
              type="number"
              id="total_area"
              name="total_area"
              className="form-input"
              value={formData.total_area}
              onChange={handleChange}
              step="0.01"
              min="0"
              placeholder="Enter area in square meters"
            />
          </div>

          {/* Height */}
          <div className="form-group">
            <label className="form-label" htmlFor="height">
              Height (m)
            </label>
            <input
              type="number"
              id="height"
              name="height"
              className="form-input"
              value={formData.height}
              onChange={handleChange}
              step="0.01"
              min="0"
              placeholder="Enter height in meters"
            />
          </div>

          {/* Occupancy Type */}
          <div className="form-group">
            <label className="form-label" htmlFor="occupancy_type">
              Occupancy Type <span className="required">*</span>
            </label>
            <select
              id="occupancy_type"
              name="occupancy_type"
              className="form-select"
              value={formData.occupancy_type}
              onChange={handleChange}
              required
            >
              <option value="RESIDENTIAL">Residential</option>
              <option value="COMMERCIAL">Commercial</option>
              <option value="INDUSTRIAL">Industrial</option>
              <option value="MIXED">Mixed</option>
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
              <option value="UNDER_CONSTRUCTION">Under Construction</option>
              <option value="DEMOLISHED">Demolished</option>
            </select>
          </div>

          {/* Fire Safety Features */}
          <div className="form-group full-width">
            <label className="form-label">Fire Safety Features</label>
            <div className="checkbox-grid">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="has_fire_alarm"
                  checked={formData.has_fire_alarm}
                  onChange={handleChange}
                />
                <span>Fire Alarm System</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="has_sprinkler"
                  checked={formData.has_sprinkler}
                  onChange={handleChange}
                />
                <span>Sprinkler System</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="has_fire_extinguishers"
                  checked={formData.has_fire_extinguishers}
                  onChange={handleChange}
                />
                <span>Fire Extinguishers</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="has_fire_exit"
                  checked={formData.has_fire_exit}
                  onChange={handleChange}
                />
                <span>Fire Exits</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="has_fire_hydrant"
                  checked={formData.has_fire_hydrant}
                  onChange={handleChange}
                />
                <span>Fire Hydrant</span>
              </label>
            </div>
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
            <span>{isSubmitting ? 'Saving...' : 'Save Building'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
