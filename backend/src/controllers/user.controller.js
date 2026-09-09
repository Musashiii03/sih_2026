/**
 * User Controller
 *
 * Handles user profile retrieval and updates.
 */

const { User, Role, Owner, Building, Organization } = require('../models');

/**
 * GET /api/users/:id
 * Returns a user's profile with roles, ownership info, and buildings.
 */
exports.getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: ['id', 'first_name', 'last_name', 'email', 'phone', 'status', 'created_at'],
      include: [
        {
          model: Role,
          as: 'roles',
          attributes: ['id', 'name', 'display_name', 'description'],
          through: { attributes: [] }, // exclude junction table columns
        },
        {
          model: Owner,
          as: 'ownerships',
          attributes: ['id', 'owner_type'],
          include: [
            {
              model: Building,
              as: 'buildings',
              attributes: ['id', 'name', 'building_type', 'number_of_floors', 'status'],
              through: { attributes: [] },
            },
          ],
        },
      ],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'NotFound',
        message: `User with id ${id} not found`,
      });
    }

    return res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users
 * Returns all users (admin use — paginated).
 */
exports.getAllUsers = async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;

    const { count, rows } = await User.findAndCountAll({
      attributes: ['id', 'first_name', 'last_name', 'email', 'phone', 'status', 'created_at'],
      include: [
        {
          model: Role,
          as: 'roles',
          attributes: ['id', 'name', 'display_name'],
          through: { attributes: [] },
        },
      ],
      limit,
      offset,
      order: [['created_at', 'DESC']],
    });

    return res.json({
      success: true,
      data: {
        users: rows,
        pagination: {
          total: count,
          page,
          limit,
          pages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/users/:id
 * Update non-sensitive profile fields: first_name, last_name, phone.
 */
exports.updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, phone } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'NotFound',
        message: `User with id ${id} not found`,
      });
    }

    await user.update({
      ...(first_name && { first_name }),
      ...(last_name  && { last_name }),
      ...(phone      && { phone }),
    });

    // Re-fetch with associations
    return exports.getUserById(req, res, next);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        error: 'Conflict',
        message: 'Phone number already in use by another account.',
      });
    }
    next(error);
  }
};
