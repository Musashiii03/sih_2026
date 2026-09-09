/**
 * User Routes
 *
 * API endpoints for user profile management.
 */

const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');

/**
 * @route   GET /api/users
 * @desc    Get all users (paginated)
 * @access  Public (should be admin-protected in production)
 */
router.get('/', userController.getAllUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Get user profile by ID with roles and buildings
 * @access  Public (should be protected in production)
 */
router.get('/:id', userController.getUserById);

/**
 * @route   PATCH /api/users/:id
 * @desc    Update user profile fields (first_name, last_name, phone)
 * @access  Public (should be protected in production)
 */
router.patch('/:id', userController.updateUser);

module.exports = router;
