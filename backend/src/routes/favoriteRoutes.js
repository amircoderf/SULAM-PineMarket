const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');

// Get user's favorites
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const result = await query(
      `SELECT f.favorite_id, f.created_at as favorited_at,
              p.product_id, p.product_name, p.description, p.price, p.unit, 
              p.stock_quantity, p.is_organic, p.rating_average, p.total_reviews,
              c.category_name,
              (SELECT image_url FROM product_images WHERE product_id = p.product_id AND is_primary = true LIMIT 1) as image_url
       FROM favorites f
       JOIN products p ON f.product_id = p.product_id
       JOIN categories c ON p.category_id = c.category_id
       WHERE f.user_id = $1
       ORDER BY f.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const countResult = await query(
      'SELECT COUNT(*) FROM favorites WHERE user_id = $1',
      [userId]
    );

    const totalFavorites = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: {
        favorites: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalFavorites,
          totalPages: Math.ceil(totalFavorites / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Add to favorites
router.post(
  '/',
  authenticate,
  [body('product_id').isUUID().withMessage('Invalid product ID')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { product_id } = req.body;
      const userId = req.user.user_id;

      // Check if product exists
      const productCheck = await query(
        'SELECT product_id FROM products WHERE product_id = $1',
        [product_id]
      );

      if (productCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Product not found',
        });
      }

      // Check if already in favorites
      const existingFavorite = await query(
        'SELECT favorite_id FROM favorites WHERE user_id = $1 AND product_id = $2',
        [userId, product_id]
      );

      if (existingFavorite.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Product already in favorites',
        });
      }

      // Add to favorites
      const result = await query(
        `INSERT INTO favorites (user_id, product_id)
         VALUES ($1, $2)
         RETURNING *`,
        [userId, product_id]
      );

      res.status(201).json({
        success: true,
        message: 'Product added to favorites',
        data: result.rows[0],
      });
    } catch (error) {
      console.error('Add favorite error:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

// Remove from favorites
router.delete('/:productId', authenticate, async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.user_id;

    const result = await query(
      'DELETE FROM favorites WHERE user_id = $1 AND product_id = $2 RETURNING *',
      [userId, productId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Favorite not found',
      });
    }

    res.json({
      success: true,
      message: 'Product removed from favorites',
    });
  } catch (error) {
    console.error('Remove favorite error:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Check if product is in favorites
router.get('/check/:productId', authenticate, async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.user_id;

    const result = await query(
      'SELECT f.favorite_id FROM favorites f WHERE f.user_id = $1 AND f.product_id = $2',
      [userId, productId]
    );

    res.json({
      success: true,
      data: {
        isFavorite: result.rows.length > 0,
      },
    });
  } catch (error) {
    console.error('Check favorite error:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Toggle favorite status
router.post('/toggle', authenticate,
  [body('product_id').isUUID().withMessage('Invalid product ID')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { product_id } = req.body;
      const userId = req.user.user_id;

      // Check if already in favorites
      const existingFavorite = await query(
        'SELECT favorite_id FROM favorites WHERE user_id = $1 AND product_id = $2',
        [userId, product_id]
      );

      if (existingFavorite.rows.length > 0) {
        // Remove from favorites
        await query(
          'DELETE FROM favorites WHERE user_id = $1 AND product_id = $2',
          [userId, product_id]
        );

        res.json({
          success: true,
          message: 'Product removed from favorites',
          data: { isFavorite: false },
        });
      } else {
        // Add to favorites
        await query(
          `INSERT INTO favorites (user_id, product_id)
           VALUES ($1, $2)`,
          [userId, product_id]
        );

        res.json({
          success: true,
          message: 'Product added to favorites',
          data: { isFavorite: true },
        });
      }
    } catch (error) {
      console.error('Toggle favorite error:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

module.exports = router;
