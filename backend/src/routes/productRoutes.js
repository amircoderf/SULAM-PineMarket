const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate, isSeller, isVerified, optionalAuth } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// @route   GET /api/products
// @desc    Get all products with filtering and pagination
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      search,
      minPrice,
      maxPrice,
      isOrganic,
      sortBy = 'created_at',
      sortOrder = 'DESC',
      sellerId,
    } = req.query;

    const offset = (page - 1) * limit;
    let whereConditions = ['p.product_status = $1'];
    let queryParams = ['active'];
    let paramCounter = 2;

    // Filter by seller if specified
    if (sellerId) {
      whereConditions.push(`p.seller_id = $${paramCounter}`);
      queryParams.push(sellerId);
      paramCounter++;
    }

    // Build where conditions
    if (category) {
      whereConditions.push(`c.category_name = $${paramCounter}`);
      queryParams.push(category);
      paramCounter++;
    }

    if (search) {
      whereConditions.push(`(p.product_name ILIKE $${paramCounter} OR p.description ILIKE $${paramCounter})`);
      queryParams.push(`%${search}%`);
      paramCounter++;
    }

    if (minPrice) {
      whereConditions.push(`p.price >= $${paramCounter}`);
      queryParams.push(minPrice);
      paramCounter++;
    }

    if (maxPrice) {
      whereConditions.push(`p.price <= $${paramCounter}`);
      queryParams.push(maxPrice);
      paramCounter++;
    }

    if (isOrganic !== undefined) {
      whereConditions.push(`p.is_organic = $${paramCounter}`);
      queryParams.push(isOrganic === 'true');
      paramCounter++;
    }

    const whereClause = whereConditions.join(' AND ');

    // Validate sort options
    const validSortFields = ['created_at', 'price', 'rating_average', 'total_sales', 'product_name'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Get products
    const productsQuery = `
      SELECT 
        p.product_id, p.product_name, p.description, p.price, p.stock_quantity,
        p.unit, p.weight, p.is_organic, p.origin, p.rating_average, p.total_reviews,
        p.total_sales, p.created_at,
        c.category_name,
        u.first_name || ' ' || u.last_name as seller_name,
        sp.business_name,
        (SELECT image_url FROM product_images WHERE product_id = p.product_id AND is_primary = true LIMIT 1) as image_url,
        ${req.user ? `EXISTS(SELECT 1 FROM favorites WHERE user_id = $${paramCounter} AND product_id = p.product_id) as is_favorite` : 'false as is_favorite'}
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
      LEFT JOIN users u ON p.seller_id = u.user_id
      LEFT JOIN seller_profiles sp ON p.seller_id = sp.seller_id
      WHERE ${whereClause}
      ORDER BY p.${sortField} ${order}
      LIMIT $${paramCounter + (req.user ? 1 : 0)} OFFSET $${paramCounter + (req.user ? 2 : 1)}
    `;

    if (req.user) {
      queryParams.push(req.user.user_id);
    }
    queryParams.push(limit, offset);

    const products = await query(productsQuery, queryParams);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
      WHERE ${whereClause}
    `;
    const countResult = await query(countQuery, queryParams.slice(0, paramCounter - 1));
    const total = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      data: {
        products: products.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get products error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message,
    });
  }
});

// @route   GET /api/products/:id
// @desc    Get single product details
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const productQuery = `
      SELECT 
        p.*, 
        c.category_name,
        u.first_name || ' ' || u.last_name as seller_name,
        u.email as seller_email,
        sp.business_name, sp.business_description, sp.rating_average as seller_rating,
        (SELECT COALESCE(SUM(oi.quantity), 0) FROM order_items oi WHERE oi.product_id = p.product_id) as total_sales,
        ${req.user ? `EXISTS(SELECT 1 FROM favorites WHERE user_id = $2 AND product_id = p.product_id) as is_favorite` : 'false as is_favorite'}
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
      LEFT JOIN users u ON p.seller_id = u.user_id
      LEFT JOIN seller_profiles sp ON p.seller_id = sp.seller_id
      WHERE p.product_id = $1
    `;

    const params = req.user ? [id, req.user.user_id] : [id];
    const productResult = await query(productQuery, params);

    if (productResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Get product images
    const imagesResult = await query(
      'SELECT image_id, image_url, is_primary, display_order FROM product_images WHERE product_id = $1 ORDER BY display_order',
      [id]
    );

    // Increment views count
    await query(
      'UPDATE products SET views_count = views_count + 1 WHERE product_id = $1',
      [id]
    );

    res.json({
      success: true,
      data: {
        product: {
          ...productResult.rows[0],
          images: imagesResult.rows,
        },
      },
    });
  } catch (error) {
    console.error('Get product error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
      error: error.message,
    });
  }
});

// @route   POST /api/products
// @desc    Create a new product
// @access  Private (Seller only)
router.post('/', [authenticate, isSeller], async (req, res) => {
  try {
    const {
      categoryId,
      productName,
      description,
      price,
      stockQuantity,
      unit = 'piece',
      weight,
      isOrganic = false,
      origin,
      harvestDate,
    } = req.body;

    // Validate required fields
    if (!productName || !price || stockQuantity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Product name, price, and stock quantity are required',
      });
    }

    const result = await query(
      `INSERT INTO products (
        seller_id, category_id, product_name, description, price, 
        stock_quantity, unit, weight, is_organic, origin, harvest_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        req.user.user_id,
        categoryId,
        productName,
        description,
        price,
        stockQuantity,
        unit,
        weight,
        isOrganic,
        origin,
        harvestDate,
      ]
    );

    // Update seller's total products count
    await query(
      'UPDATE seller_profiles SET total_products = total_products + 1 WHERE seller_id = $1',
      [req.user.user_id]
    );

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: {
        product: result.rows[0],
      },
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create product',
    });
  }
});

// @route   PUT /api/products/:id
// @desc    Update product
// @access  Private (Seller - own products only)
router.put('/:id', [authenticate, isSeller], async (req, res) => {
  try {
    const { id } = req.params;

    // Check if product belongs to seller
    const checkResult = await query(
      'SELECT product_id FROM products WHERE product_id = $1 AND seller_id = $2',
      [id, req.user.user_id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or you do not have permission to edit it',
      });
    }

    const {
      categoryId,
      productName,
      description,
      price,
      stockQuantity,
      unit,
      weight,
      isOrganic,
      origin,
      productStatus,
    } = req.body;

    const result = await query(
      `UPDATE products SET
        category_id = COALESCE($1, category_id),
        product_name = COALESCE($2, product_name),
        description = COALESCE($3, description),
        price = COALESCE($4, price),
        stock_quantity = COALESCE($5, stock_quantity),
        unit = COALESCE($6, unit),
        weight = COALESCE($7, weight),
        is_organic = COALESCE($8, is_organic),
        origin = COALESCE($9, origin),
        product_status = COALESCE($10, product_status),
        updated_at = CURRENT_TIMESTAMP
      WHERE product_id = $11
      RETURNING *`,
      [
        categoryId,
        productName,
        description,
        price,
        stockQuantity,
        unit,
        weight,
        isOrganic,
        origin,
        productStatus,
        id,
      ]
    );

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: {
        product: result.rows[0],
      },
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product',
    });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete product
// @access  Private (Seller - own products only)
router.delete('/:id', [authenticate, isSeller], async (req, res) => {
  try {
    const { id } = req.params;

    // Use soft delete instead of hard delete to avoid foreign key issues
    const result = await query(
      `UPDATE products 
       SET product_status = 'deleted', updated_at = CURRENT_TIMESTAMP 
       WHERE product_id = $1 AND seller_id = $2 
       RETURNING product_id`,
      [id, req.user.user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or you do not have permission to delete it',
      });
    }

    // Update seller's total products count
    await query(
      'UPDATE seller_profiles SET total_products = total_products - 1 WHERE seller_id = $1',
      [req.user.user_id]
    );

    res.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product',
      error: error.message,
    });
  }
});

module.exports = router;
