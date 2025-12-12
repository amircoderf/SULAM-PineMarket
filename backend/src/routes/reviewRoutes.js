const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');

// Get reviews for a product
router.get('/products/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10, sortBy = 'created_at' } = req.query;
    
    const offset = (page - 1) * limit;
    
    const reviewsResult = await query(
      `SELECT r.*, u.first_name, u.last_name, u.email
       FROM reviews r
       JOIN users u ON r.user_id = u.user_id
       WHERE r.product_id = $1
       ORDER BY r.${sortBy} DESC
       LIMIT $2 OFFSET $3`,
      [productId, limit, offset]
    );

    const countResult = await query(
      'SELECT COUNT(*) FROM reviews WHERE product_id = $1',
      [productId]
    );

    const totalReviews = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: {
        reviews: reviewsResult.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalReviews,
          totalPages: Math.ceil(totalReviews / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Create a review
router.post(
  '/',
  authenticate,
  [
    body('product_id').isUUID().withMessage('Invalid product ID'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').optional().isString().trim(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { product_id, rating, comment } = req.body;
      const userId = req.user.user_id;

      // Check if user has already reviewed this product
      const existingReview = await query(
        'SELECT review_id FROM reviews WHERE user_id = $1 AND product_id = $2',
        [userId, product_id]
      );

      if (existingReview.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'You have already reviewed this product',
        });
      }

      // Check if user has purchased this product (optional - set is_verified_purchase)
      const purchaseCheck = await query(
        `SELECT oi.order_item_id FROM order_items oi
         JOIN orders o ON oi.order_id = o.order_id
         WHERE o.buyer_id = $1 AND oi.product_id = $2`,
        [userId, product_id]
      );

      const isVerifiedPurchase = purchaseCheck.rows.length > 0;

      // Create review
      const result = await query(
        `INSERT INTO reviews (user_id, product_id, rating, review_text, is_verified_purchase)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [userId, product_id, rating, comment || null, isVerifiedPurchase]
      );

      // Update product rating statistics
      await query(
        `UPDATE products 
         SET rating_average = (
           SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE product_id = $1
         ),
         total_reviews = (
           SELECT COUNT(*) FROM reviews WHERE product_id = $1
         )
         WHERE product_id = $1`,
        [product_id]
      );

      res.status(201).json({
        success: true,
        message: 'Review created successfully',
        data: result.rows[0],
      });
    } catch (error) {
      console.error('Create review error:', error);
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
      res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
  }
);

// Update a review
router.put(
  '/:id',
  authenticate,
  [
    body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').optional().isString().trim(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { id } = req.params;
      const { rating, comment } = req.body;
      const userId = req.user.user_id;

      // Check if review exists and belongs to user
      const reviewCheck = await query(
        'SELECT review_id FROM reviews WHERE review_id = $1 AND user_id = $2',
        [id, userId]
      );

      if (reviewCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Review not found or you do not have permission to edit it',
        });
      }

      // Build update query
      const updates = [];
      const values = [];
      let paramCount = 1;

      if (rating !== undefined) {
        updates.push(`rating = $${paramCount++}`);
        values.push(rating);
      }

      if (comment !== undefined) {
        updates.push(`review_text = $${paramCount++}`);
        values.push(comment);
      }

      values.push(id);

      const result = await query(
        `UPDATE reviews SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
         WHERE review_id = $${paramCount}
         RETURNING *`,
        values
      );

      res.json({
        success: true,
        message: 'Review updated successfully',
        data: result.rows[0],
      });
    } catch (error) {
      console.error('Update review error:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

// Delete a review
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.user_id;

    // Check if review exists and belongs to user
    const reviewCheck = await query(
      'SELECT review_id FROM reviews WHERE review_id = $1 AND user_id = $2',
      [id, userId]
    );

    if (reviewCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or you do not have permission to delete it',
      });
    }

    await query('DELETE FROM reviews WHERE review_id = $1', [id]);

    res.json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get user's reviews
router.get('/user/my-reviews', authenticate, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const result = await query(
      `SELECT r.*, p.product_name, p.product_id
       FROM reviews r
       JOIN products p ON r.product_id = p.product_id
       WHERE r.user_id = $1
       ORDER BY r.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const countResult = await query(
      'SELECT COUNT(*) FROM reviews WHERE user_id = $1',
      [userId]
    );

    const totalReviews = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: {
        reviews: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalReviews,
          totalPages: Math.ceil(totalReviews / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get user reviews error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
