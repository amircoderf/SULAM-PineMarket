const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');

// @route   GET /api/cart
// @desc    Get user's cart items
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT 
        c.cart_id, c.quantity, c.added_at,
        p.product_id, p.product_name, p.price, p.stock_quantity, p.unit,
        (SELECT image_url FROM product_images WHERE product_id = p.product_id AND is_primary = true LIMIT 1) as image_url,
        (c.quantity * p.price) as subtotal
      FROM cart c
      JOIN products p ON c.product_id = p.product_id
      WHERE c.user_id = $1
      ORDER BY c.added_at DESC`,
      [req.user.user_id]
    );

    const total = result.rows.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);

    res.json({
      success: true,
      data: {
        items: result.rows,
        summary: {
          itemCount: result.rows.length,
          total: total.toFixed(2),
        },
      },
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cart',
    });
  }
});

// @route   POST /api/cart
// @desc    Add item to cart
// @access  Private
router.post('/', authenticate, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!productId || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid product ID and quantity are required',
      });
    }

    // Check if product exists and has stock
    const productResult = await query(
      'SELECT product_id, stock_quantity FROM products WHERE product_id = $1 AND product_status = $2',
      [productId, 'active']
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or not available',
      });
    }

    const product = productResult.rows[0];

    if (product.stock_quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock',
      });
    }

    // Check if item already in cart
    const existingItem = await query(
      'SELECT cart_id, quantity FROM cart WHERE user_id = $1 AND product_id = $2',
      [req.user.user_id, productId]
    );

    let result;

    if (existingItem.rows.length > 0) {
      // Update existing cart item
      const newQuantity = existingItem.rows[0].quantity + quantity;
      
      if (newQuantity > product.stock_quantity) {
        return res.status(400).json({
          success: false,
          message: 'Total quantity exceeds available stock',
        });
      }

      result = await query(
        'UPDATE cart SET quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE cart_id = $2 RETURNING *',
        [newQuantity, existingItem.rows[0].cart_id]
      );
    } else {
      // Add new cart item
      result = await query(
        'INSERT INTO cart (user_id, product_id, quantity) VALUES ($1, $2, $3) RETURNING *',
        [req.user.user_id, productId, quantity]
      );
    }

    res.status(201).json({
      success: true,
      message: 'Item added to cart',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add item to cart',
    });
  }
});

// @route   PUT /api/cart/:id
// @desc    Update cart item quantity
// @access  Private
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid quantity is required',
      });
    }

    // Get cart item and check ownership
    const cartItem = await query(
      `SELECT c.cart_id, p.stock_quantity 
       FROM cart c 
       JOIN products p ON c.product_id = p.product_id
       WHERE c.cart_id = $1 AND c.user_id = $2`,
      [id, req.user.user_id]
    );

    if (cartItem.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found',
      });
    }

    if (quantity > cartItem.rows[0].stock_quantity) {
      return res.status(400).json({
        success: false,
        message: 'Quantity exceeds available stock',
      });
    }

    const result = await query(
      'UPDATE cart SET quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE cart_id = $2 RETURNING *',
      [quantity, id]
    );

    res.json({
      success: true,
      message: 'Cart updated',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update cart',
    });
  }
});

// @route   DELETE /api/cart/:id
// @desc    Remove item from cart
// @access  Private
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM cart WHERE cart_id = $1 AND user_id = $2 RETURNING cart_id',
      [id, req.user.user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found',
      });
    }

    res.json({
      success: true,
      message: 'Item removed from cart',
    });
  } catch (error) {
    console.error('Delete cart item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove item',
    });
  }
});

// @route   DELETE /api/cart
// @desc    Clear entire cart
// @access  Private
router.delete('/', authenticate, async (req, res) => {
  try {
    await query('DELETE FROM cart WHERE user_id = $1', [req.user.user_id]);

    res.json({
      success: true,
      message: 'Cart cleared',
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cart',
    });
  }
});

module.exports = router;
