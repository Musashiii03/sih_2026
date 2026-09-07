/**
 * Organization Controller
 * 
 * Handles organization-related operations
 */

const { Organization, Address, Owner } = require('../models');
const { Op } = require('sequelize');

/**
 * Get all organizations
 */
exports.getAllOrganizations = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      organization_type
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    if (status) where.status = status;
    if (organization_type) where.organization_type = organization_type;

    const { count, rows: organizations } = await Organization.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: Address,
          as: 'address'
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        organizations,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching organizations:', error);
    next(error);
  }
};

/**
 * Get organization by ID
 */
exports.getOrganizationById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const organization = await Organization.findByPk(id, {
      include: [
        {
          model: Address,
          as: 'address'
        },
        {
          model: Owner,
          as: 'ownerships'
        }
      ]
    });

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    res.json({
      success: true,
      data: organization
    });

  } catch (error) {
    console.error('Error fetching organization:', error);
    next(error);
  }
};

/**
 * Create new organization
 */
exports.createOrganization = async (req, res, next) => {
  try {
    const {
      name,
      organization_type,
      registration_number,
      email,
      phone,
      status
    } = req.body;

    // Validate required fields
    if (!name || !organization_type) {
      return res.status(400).json({
        success: false,
        message: 'Name and organization type are required'
      });
    }

    // Check if registration number already exists (if provided)
    if (registration_number) {
      const existing = await Organization.findOne({
        where: { registration_number }
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Registration number already exists'
        });
      }
    }

    // Create organization
    const organization = await Organization.create({
      name,
      organization_type,
      registration_number,
      email,
      phone,
      status: status || 'ACTIVE'
    });

    res.status(201).json({
      success: true,
      message: 'Organization created successfully',
      data: organization
    });

  } catch (error) {
    console.error('Error creating organization:', error);
    
    // Handle validation errors
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors.map(e => ({
          field: e.path,
          message: e.message
        }))
      });
    }

    next(error);
  }
};

/**
 * Update organization
 */
exports.updateOrganization = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      organization_type,
      registration_number,
      email,
      phone,
      status
    } = req.body;

    const organization = await Organization.findByPk(id);

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    // Check if registration number already exists (if changing)
    if (registration_number && registration_number !== organization.registration_number) {
      const existing = await Organization.findOne({
        where: {
          registration_number,
          id: { [Op.ne]: id }
        }
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Registration number already exists'
        });
      }
    }

    // Update organization
    await organization.update({
      name: name || organization.name,
      organization_type: organization_type || organization.organization_type,
      registration_number,
      email,
      phone,
      status: status || organization.status
    });

    res.json({
      success: true,
      message: 'Organization updated successfully',
      data: organization
    });

  } catch (error) {
    console.error('Error updating organization:', error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors.map(e => ({
          field: e.path,
          message: e.message
        }))
      });
    }

    next(error);
  }
};

/**
 * Delete organization
 */
exports.deleteOrganization = async (req, res, next) => {
  try {
    const { id } = req.params;

    const organization = await Organization.findByPk(id);

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    await organization.destroy();

    res.json({
      success: true,
      message: 'Organization deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting organization:', error);
    next(error);
  }
};
