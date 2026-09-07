/**
 * Organization Routes
 * 
 * API endpoints for organization management
 */

const express = require('express');
const router = express.Router();
const organizationController = require('../controllers/organization.controller');

/**
 * @route   GET /api/organizations
 * @desc    Get all organizations with pagination
 * @access  Public
 * @query   page, limit, status, organization_type
 */
router.get('/', organizationController.getAllOrganizations);

/**
 * @route   GET /api/organizations/:id
 * @desc    Get organization by ID
 * @access  Public
 */
router.get('/:id', organizationController.getOrganizationById);

/**
 * @route   POST /api/organizations
 * @desc    Create new organization
 * @access  Public
 */
router.post('/', organizationController.createOrganization);

/**
 * @route   PUT /api/organizations/:id
 * @desc    Update organization
 * @access  Public
 */
router.put('/:id', organizationController.updateOrganization);

/**
 * @route   DELETE /api/organizations/:id
 * @desc    Delete organization
 * @access  Public
 */
router.delete('/:id', organizationController.deleteOrganization);

module.exports = router;
