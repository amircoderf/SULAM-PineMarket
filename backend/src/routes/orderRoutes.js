const express = require('express');
const router = express.Router();
const { query, transaction } = require('../config/database');
const { authenticate } = require('../middleware/auth');

// Helper function to generate order number
const generateOrderNumber = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 7);
  return `PM-${timestamp}-${random}`.toUpperCase();
};

// @route   POST /api/orders
// @desc    Create a new order from cart
// @access  Private
router.post('/', authenticate, async (req, res) => {
  try {
    let { shippingAddressId, paymentMethod, notes } = req.body;

    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Payment method is required',
      });
    }

    const result = await transaction(async (client) => {
      // If no address provided, create or use default address
      if (!shippingAddressId) {
        const existingAddress = await client.query(
          'SELECT address_id FROM user_addresses WHERE user_id = $1 AND is_default = true LIMIT 1',
          [req.user.user_id]
        );

        if (existingAddress.rows.length > 0) {
          shippingAddressId = existingAddress.rows[0].address_id;
        } else {
          // Create a default address
          const newAddress = await client.query(
            `INSERT INTO user_addresses (user_id, street_address, city, state, postal_code, country, is_default)
             VALUES ($1, 'Default Address', 'City', 'State', '00000', 'Malaysia', true)
             RETURNING address_id`,
            [req.user.user_id]
          );
          shippingAddressId = newAddress.rows[0].address_id;
        }
      }
      
      // Get cart items with product details
      const cartItems = await client.query(
        `SELECT 
          c.cart_id, c.product_id, c.quantity,
          p.price, p.stock_quantity, p.seller_id, p.product_name
        FROM cart c
        JOIN products p ON c.product_id = p.product_id
        WHERE c.user_id = $1 AND p.product_status = 'active'`,
        [req.user.user_id]
      );

      if (cartItems.rows.length === 0) {
        throw new Error('Cart is empty');
      }

      // Calculate totals
      let totalAmount = 0;
      for (const item of cartItems.rows) {
        if (item.quantity > item.stock_quantity) {
          throw new Error(`Insufficient stock for ${item.product_name}`);
        }
        totalAmount += parseFloat(item.price) * item.quantity;
      }

      const shippingFee = 50.00; // Fixed shipping fee
      const taxAmount = totalAmount * 0.12; // 12% VAT
      const finalAmount = totalAmount + shippingFee + taxAmount;

      // Create order
      const orderNumber = generateOrderNumber();
      const orderResult = await client.query(
        `INSERT INTO orders (
          buyer_id, order_number, total_amount, shipping_fee, 
          tax_amount, final_amount, payment_method, shipping_address_id, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        [
          req.user.user_id,
          orderNumber,
          totalAmount,
          shippingFee,
          taxAmount,
          finalAmount,
          paymentMethod,
          shippingAddressId,
          notes,
        ]
      );

      const order = orderResult.rows[0];

      // Create order items and update stock
      for (const item of cartItems.rows) {
        const itemTotal = parseFloat(item.price) * item.quantity;

        await client.query(
          `INSERT INTO order_items (
            order_id, product_id, seller_id, quantity, unit_price, total_price
          ) VALUES ($1, $2, $3, $4, $5, $6)`,
          [order.order_id, item.product_id, item.seller_id, item.quantity, item.price, itemTotal]
        );

        // Update product stock
        await client.query(
          'UPDATE products SET stock_quantity = stock_quantity - $1 WHERE product_id = $2',
          [item.quantity, item.product_id]
        );
      }

      // Clear cart
      await client.query('DELETE FROM cart WHERE user_id = $1', [req.user.user_id]);

      return order;
    });

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        order: result,
      },
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create order',
    });
  }
});

// @route   GET /api/orders
// @desc    Get user's orders
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'buyer_id = $1';
    const params = [req.user.user_id];

    if (status) {
      whereClause += ' AND order_status = $2';
      params.push(status);
    }

    const result = await query(
      `SELECT 
        o.*,
        COUNT(oi.order_item_id) as item_count
      FROM orders o
      LEFT JOIN order_items oi ON o.order_id = oi.order_id
      WHERE ${whereClause}
      GROUP BY o.order_id
      ORDER BY o.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      data: {
        orders: result.rows,
      },
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
    });
  }
});

// @route   GET /api/orders/:id
// @desc    Get order details
// @access  Private
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Get order
    const orderResult = await query(
      `SELECT o.*, a.street_address, a.city, a.state, a.postal_code, a.country
       FROM orders o
       LEFT JOIN user_addresses a ON o.shipping_address_id = a.address_id
       WHERE o.order_id = $1 AND o.buyer_id = $2`,
      [id, req.user.user_id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Get order items
    const itemsResult = await query(
      `SELECT 
        oi.*,
        p.product_name, p.unit,
        (SELECT image_url FROM product_images WHERE product_id = p.product_id AND is_primary = true LIMIT 1) as image_url
      FROM order_items oi
      JOIN products p ON oi.product_id = p.product_id
      WHERE oi.order_id = $1`,
      [id]
    );

    res.json({
      success: true,
      data: {
        order: {
          ...orderResult.rows[0],
          items: itemsResult.rows,
        },
      },
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order',
    });
  }
});

module.exports = router;
