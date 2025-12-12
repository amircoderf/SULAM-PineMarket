const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');

// Get all addresses for current user
router.get('/', authenticate, async (req, res) => {
  try {
    const addresses = await query(
      `SELECT * FROM user_addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC`,
      [req.user.user_id]
    );
    res.json({ success: true, data: addresses.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch addresses' });
  }
});

// Add a new address
router.post('/', authenticate, async (req, res) => {
  try {
    const { street_address, city, state, postal_code, country, is_default } = req.body;
    if (!street_address || !city || !state || !postal_code) {
      return res.status(400).json({ success: false, message: 'All address fields are required' });
    }
    // If is_default, unset previous default
    if (is_default) {
      await query(
        `UPDATE user_addresses SET is_default = false WHERE user_id = $1`,
        [req.user.user_id]
      );
    }
    const result = await query(
      `INSERT INTO user_addresses (user_id, street_address, city, state, postal_code, country, is_default)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.user.user_id, street_address, city, state, postal_code, country || 'Malaysia', !!is_default]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add address' });
  }
});

// Set an address as default
router.put('/:id/default', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    await query(
      `UPDATE user_addresses SET is_default = false WHERE user_id = $1`,
      [req.user.user_id]
    );
    await query(
      `UPDATE user_addresses SET is_default = true WHERE address_id = $1 AND user_id = $2`,
      [id, req.user.user_id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to set default address' });
  }
});

// Delete an address
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    await query(
      `DELETE FROM user_addresses WHERE address_id = $1 AND user_id = $2`,
      [id, req.user.user_id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete address' });
  }
});

module.exports = router;
