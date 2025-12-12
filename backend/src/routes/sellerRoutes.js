const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');

// Get seller statistics
router.get('/stats', authenticate, async (req, res) => {
  try {
    const sellerId = req.user.user_id;

    // Get product stats
    const productStats = await query(
      `SELECT 
        COUNT(*) as total_products,
        COUNT(CASE WHEN stock_quantity > 0 THEN 1 END) as active_products,
        COALESCE(SUM(total_sales), 0) as total_sales
       FROM products 
       WHERE seller_id = $1 AND product_status != 'deleted'`,
      [sellerId]
    );

    // Get revenue from completed orders
    const revenueResult = await query(
      `SELECT COALESCE(SUM(oi.total_price), 0) as total_revenue
       FROM order_items oi
       JOIN products p ON oi.product_id = p.product_id
       JOIN orders o ON oi.order_id = o.order_id
       WHERE p.seller_id = $1 
       AND o.order_status NOT IN ('cancelled', 'refunded')`,
      [sellerId]
    );

    // Get total units sold for this seller from completed orders (sum of order_items.quantity)
    const salesUnitsResult = await query(
      `SELECT COALESCE(SUM(oi.quantity), 0) as total_sales
       FROM order_items oi
       JOIN products p ON oi.product_id = p.product_id
       JOIN orders o ON oi.order_id = o.order_id
       WHERE p.seller_id = $1 
       AND o.order_status NOT IN ('cancelled', 'refunded')`,
      [sellerId]
    );

    // Get monthly revenue (last 12 months)
    const monthlyRevenue = await query(
      `SELECT 
        to_char(DATE_TRUNC('month', o.created_at AT TIME ZONE 'UTC'), 'YYYY-MM') as month,
        COALESCE(SUM(oi.total_price), 0) as revenue
       FROM order_items oi
       JOIN products p ON oi.product_id = p.product_id
       JOIN orders o ON oi.order_id = o.order_id
       WHERE p.seller_id = $1 
       AND o.order_status NOT IN ('cancelled', 'refunded')
       AND o.created_at >= NOW() - INTERVAL '12 months'
       GROUP BY DATE_TRUNC('month', o.created_at AT TIME ZONE 'UTC')
       ORDER BY month DESC`,
      [sellerId]
    );

    // Get top selling products
    const topProducts = await query(
      `SELECT 
        p.product_id,
        p.product_name,
        p.price,
        (SELECT image_url FROM product_images WHERE product_id = p.product_id AND is_primary = true LIMIT 1) as image_url,
        COALESCE(SUM(oi.quantity), 0) as units_sold,
        COALESCE(SUM(oi.total_price), 0) as revenue
       FROM products p
       LEFT JOIN order_items oi ON p.product_id = oi.product_id
       LEFT JOIN orders o ON oi.order_id = o.order_id
       WHERE p.seller_id = $1 
       AND p.product_status != 'deleted'
       AND (o.order_status IS NULL OR o.order_status NOT IN ('cancelled', 'refunded'))
       GROUP BY p.product_id, p.product_name, p.price
       ORDER BY units_sold DESC
       LIMIT 10`,
      [sellerId]
    );

    const stats = {
      totalProducts: parseInt(productStats.rows[0]?.total_products || 0),
      activeProducts: parseInt(productStats.rows[0]?.active_products || 0),
      // Prefer actual sold units from order_items; fall back to product's stored total_sales
      totalSales: parseInt(salesUnitsResult.rows[0]?.total_sales || productStats.rows[0]?.total_sales || 0),
      totalRevenue: parseFloat(revenueResult.rows[0]?.total_revenue || 0),
      monthlyRevenue: monthlyRevenue.rows,
      topProducts: topProducts.rows,
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Get seller stats error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Get seller's orders (orders containing seller's products)
router.get('/orders', authenticate, async (req, res) => {
  try {
    const sellerId = req.user.user_id;
    const { page = 1, limit = 20, status, productId } = req.query;

    const offset = (page - 1) * limit;
    let whereConditions = ['p.seller_id = $1'];
    let queryParams = [sellerId];
    let paramCounter = 2;
    let productParamIndex = null;

    if (status) {
      whereConditions.push(`o.order_status = $${paramCounter}`);
      queryParams.push(status);
      paramCounter++;
    }

    if (productId) {
      whereConditions.push(`oi.product_id = $${paramCounter}`);
      queryParams.push(productId);
      productParamIndex = paramCounter;
      paramCounter++;
    }

    const whereClause = whereConditions.join(' AND ');

    // Get orders with seller's products (using CTE to avoid DISTINCT issues)
    const ordersQuery = `
      WITH seller_orders AS (
        SELECT DISTINCT o.order_id
        FROM orders o
        JOIN order_items oi ON o.order_id = oi.order_id
        JOIN products p ON oi.product_id = p.product_id
        WHERE ${whereClause}
      )
      SELECT
        o.order_id,
        o.buyer_id,
        o.order_status,
        o.total_amount,
        o.created_at,
        o.updated_at,
        u.first_name || ' ' || u.last_name as buyer_name,
        u.email as buyer_email,
        COALESCE(a.street_address || ', ' || a.city || ', ' || a.state || ' ' || a.postal_code || ', ' || a.country, 'No address provided') as delivery_address,
        (
          SELECT json_agg(
            json_build_object(
              'product_id', p2.product_id,
              'product_name', p2.product_name,
              'price', p2.price,
              'quantity', oi2.quantity,
              'total_price', oi2.total_price,
              'image_url', (SELECT image_url FROM product_images WHERE product_id = p2.product_id AND is_primary = true LIMIT 1)
            )
          )
          FROM order_items oi2
          JOIN products p2 ON oi2.product_id = p2.product_id
          WHERE oi2.order_id = o.order_id AND p2.seller_id = $1
            ${productParamIndex ? `AND p2.product_id = $${productParamIndex}` : ''}
        ) as order_items
      FROM seller_orders so
      JOIN orders o ON so.order_id = o.order_id
      JOIN users u ON o.buyer_id = u.user_id
      LEFT JOIN user_addresses a ON o.shipping_address_id = a.address_id
      ORDER BY o.created_at DESC
      LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
    `;

    queryParams.push(limit, offset);

    const orders = await query(ordersQuery, queryParams);

    // Get total count
    const countQuery = `
      SELECT COUNT(DISTINCT o.order_id) as total
      FROM orders o
      JOIN order_items oi ON o.order_id = oi.order_id
      JOIN products p ON oi.product_id = p.product_id
      WHERE ${whereClause}
    `;
    const countResult = await query(countQuery, queryParams.slice(0, paramCounter - 1));
    const total = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      data: {
        orders: orders.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get seller orders error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

module.exports = router;
