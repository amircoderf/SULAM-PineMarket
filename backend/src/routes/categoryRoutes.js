const express = require('express');
const router = express.Router();

// @route   GET /api/categories
// @desc    Get all categories
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { query } = require('../config/database');
    
    const result = await query(
      `SELECT category_id as id, category_name as name, description, image_url
       FROM categories
       WHERE is_active = true
       ORDER BY category_name`
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
    });
  }
});

module.exports = router;
