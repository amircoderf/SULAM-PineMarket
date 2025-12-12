-- Seed Data for PineMarket Database

-- ==========================================
-- INSERT CATEGORIES
-- ==========================================
INSERT INTO categories (category_name, description, is_active) VALUES
('Fresh Pineapples', 'Fresh whole pineapples from local farms', TRUE),
('Pineapple Juice', 'Fresh and packaged pineapple juice products', TRUE),
('Dried Pineapple', 'Naturally dried pineapple snacks', TRUE),
('Pineapple Jam', 'Homemade and commercial pineapple jams and preserves', TRUE),
('Pineapple Desserts', 'Cakes, tarts, and other pineapple desserts', TRUE),
('Pineapple Cosmetics', 'Beauty and skincare products with pineapple extracts', TRUE),
('Processed Products', 'Canned pineapples and other processed items', TRUE);

-- ==========================================
-- INSERT SAMPLE USERS (Buyers)
-- ==========================================
-- Password: 'password123' hashed with bcrypt
INSERT INTO users (email, phone, password_hash, first_name, last_name, user_type, is_verified) VALUES
('buyer1@example.com', '+639171234567', '$2b$10$rBV2NZYjXjKxjLQ5t.V2HOk0KLW9kG8Y5d.JhQXZQYYgJFqJU3xXu', 'Juan', 'Dela Cruz', 'buyer', TRUE),
('buyer2@example.com', '+639181234567', '$2b$10$rBV2NZYjXjKxjLQ5t.V2HOk0KLW9kG8Y5d.JhQXZQYYgJFqJU3xXu', 'Maria', 'Santos', 'buyer', TRUE),
('buyer3@example.com', '+639191234567', '$2b$10$rBV2NZYjXjKxjLQ5t.V2HOk0KLW9kG8Y5d.JhQXZQYYgJFqJU3xXu', 'Pedro', 'Reyes', 'buyer', TRUE);

-- ==========================================
-- INSERT SAMPLE USERS (Sellers)
-- ==========================================
INSERT INTO users (email, phone, password_hash, first_name, last_name, user_type, is_verified) VALUES
('seller1@example.com', '+639201234567', '$2b$10$rBV2NZYjXjKxjLQ5t.V2HOk0KLW9kG8Y5d.JhQXZQYYgJFqJU3xXu', 'Roberto', 'Garcia', 'seller', TRUE),
('seller2@example.com', '+639211234567', '$2b$10$rBV2NZYjXjKxjLQ5t.V2HOk0KLW9kG8Y5d.JhQXZQYYgJFqJU3xXu', 'Ana', 'Martinez', 'seller', TRUE),
('seller3@example.com', '+639221234567', '$2b$10$rBV2NZYjXjKxjLQ5t.V2HOk0KLW9kG8Y5d.JhQXZQYYgJFqJU3xXu', 'Carlos', 'Fernandez', 'both', TRUE);

-- ==========================================
-- INSERT SELLER PROFILES
-- ==========================================
INSERT INTO seller_profiles (seller_id, business_name, business_description, is_verified)
SELECT user_id, 
       CASE 
           WHEN first_name = 'Roberto' THEN 'Golden Pineapple Farm'
           WHEN first_name = 'Ana' THEN 'Tropical Delights'
           ELSE 'Pineapple Paradise'
       END,
       CASE 
           WHEN first_name = 'Roberto' THEN 'Premium fresh pineapples from our organic farm in Mindanao'
           WHEN first_name = 'Ana' THEN 'Handcrafted pineapple products made with love'
           ELSE 'Your one-stop shop for all pineapple products'
       END,
       TRUE
FROM users 
WHERE user_type IN ('seller', 'both');

-- ==========================================
-- INSERT SAMPLE PRODUCTS
-- ==========================================
-- Get category and seller IDs for insertion
DO $$
DECLARE
    cat_fresh UUID;
    cat_juice UUID;
    cat_dried UUID;
    cat_jam UUID;
    seller1_id UUID;
    seller2_id UUID;
    seller3_id UUID;
BEGIN
    -- Get category IDs
    SELECT category_id INTO cat_fresh FROM categories WHERE category_name = 'Fresh Pineapples';
    SELECT category_id INTO cat_juice FROM categories WHERE category_name = 'Pineapple Juice';
    SELECT category_id INTO cat_dried FROM categories WHERE category_name = 'Dried Pineapple';
    SELECT category_id INTO cat_jam FROM categories WHERE category_name = 'Pineapple Jam';
    
    -- Get seller IDs
    SELECT user_id INTO seller1_id FROM users WHERE email = 'seller1@example.com';
    SELECT user_id INTO seller2_id FROM users WHERE email = 'seller2@example.com';
    SELECT user_id INTO seller3_id FROM users WHERE email = 'seller3@example.com';
    
    -- Insert products
    INSERT INTO products (seller_id, category_id, product_name, description, price, stock_quantity, unit, weight, is_organic, origin, rating_average, total_reviews) VALUES
    (seller1_id, cat_fresh, 'Premium Queen Pineapple', 'Sweet and juicy Queen variety pineapples, freshly harvested from our organic farm', 150.00, 100, 'piece', 1.5, TRUE, 'Bukidnon', 4.8, 45),
    (seller1_id, cat_fresh, 'MD2 Sweet Pineapple', 'Golden yellow MD2 pineapples with extra sweetness and low acidity', 180.00, 75, 'piece', 1.8, FALSE, 'Davao', 4.7, 32),
    (seller1_id, cat_fresh, 'Red Spanish Pineapple', 'Traditional variety with aromatic flavor, perfect for cooking', 120.00, 60, 'piece', 1.2, FALSE, 'Tagum', 4.5, 28),
    
    (seller2_id, cat_juice, 'Fresh Pineapple Juice 1L', '100% pure pineapple juice, no preservatives or added sugar', 95.00, 200, 'bottle', 1.0, TRUE, 'Manila', 4.9, 78),
    (seller2_id, cat_juice, 'Pineapple Concentrate 500ml', 'Concentrated pineapple juice for drinks and smoothies', 180.00, 150, 'bottle', 0.5, FALSE, 'Quezon City', 4.6, 45),
    
    (seller2_id, cat_dried, 'Dried Pineapple Rings 200g', 'Naturally dried pineapple slices, perfect healthy snack', 120.00, 300, 'pack', 0.2, TRUE, 'Laguna', 4.8, 92),
    (seller2_id, cat_dried, 'Pineapple Chips 150g', 'Crispy pineapple chips, lightly sweetened', 85.00, 250, 'pack', 0.15, FALSE, 'Cebu', 4.7, 67),
    
    (seller3_id, cat_jam, 'Homemade Pineapple Jam 250g', 'Artisanal pineapple jam made from fresh fruits', 180.00, 120, 'jar', 0.25, TRUE, 'Batangas', 4.9, 55),
    (seller3_id, cat_jam, 'Pineapple Preserve 500g', 'Chunky pineapple preserve with natural ingredients', 250.00, 80, 'jar', 0.5, TRUE, 'Cavite', 4.8, 41),
    
    (seller3_id, cat_fresh, 'Mini Pineapple (5 pcs)', 'Small sweet pineapples, perfect for individual servings', 200.00, 50, 'bundle', 2.5, FALSE, 'Mindoro', 4.6, 34);
END $$;

-- ==========================================
-- INSERT SAMPLE ADDRESSES
-- ==========================================
INSERT INTO user_addresses (user_id, address_type, street_address, city, state, postal_code, is_default)
SELECT user_id, 'both', '123 Main Street, Brgy. San Roque', 'Manila', 'Metro Manila', '1000', TRUE
FROM users WHERE email = 'buyer1@example.com'
UNION ALL
SELECT user_id, 'shipping', '456 Beach Road, Brgy. Poblacion', 'Cebu City', 'Cebu', '6000', TRUE
FROM users WHERE email = 'buyer2@example.com'
UNION ALL
SELECT user_id, 'both', '789 Mountain View, Brgy. Maligaya', 'Davao City', 'Davao del Sur', '8000', TRUE
FROM users WHERE email = 'buyer3@example.com';

-- ==========================================
-- SAMPLE ORDER NUMBER SEQUENCE
-- ==========================================
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 10001;

-- Note: Additional sample data for orders, reviews, etc. can be added as needed
-- The above provides a good foundation for testing the system

-- ==========================================
-- INSERT SAMPLE ORDERS & ORDER ITEMS (for Revenue Chart)
-- Creates orders across the last 6 months to avoid zero revenue on seller charts
-- ==========================================
DO $$
DECLARE
        b1 UUID;
        b2 UUID;
        b3 UUID;
        p1 UUID;
        p2 UUID;
        p3 UUID;
        o_id UUID;
BEGIN
    -- Buyers
    SELECT user_id INTO b1 FROM users WHERE email='buyer1@example.com';
    SELECT user_id INTO b2 FROM users WHERE email='buyer2@example.com';
    SELECT user_id INTO b3 FROM users WHERE email='buyer3@example.com';

    -- Products
    SELECT product_id INTO p1 FROM products WHERE product_name = 'Premium Queen Pineapple' LIMIT 1;
    SELECT product_id INTO p2 FROM products WHERE product_name = 'Fresh Pineapple Juice 1L' LIMIT 1;
    SELECT product_id INTO p3 FROM products WHERE product_name = 'Homemade Pineapple Jam 250g' LIMIT 1;

    -- July 2025 order
    INSERT INTO orders (buyer_id, order_number, total_amount, final_amount, order_status, payment_status, payment_method, shipping_address_id, created_at)
    VALUES (b1, nextval('order_number_seq')::text, 300.00, 300.00, 'delivered', 'paid', 'card', (SELECT address_id FROM user_addresses WHERE user_id = b1 LIMIT 1), '2025-07-12 09:20:00') RETURNING order_id INTO o_id;
    INSERT INTO order_items (order_id, product_id, seller_id, quantity, unit_price, total_price, created_at)
    VALUES (o_id, p1, (SELECT seller_id FROM products WHERE product_id = p1), 2, 150.00, 300.00, '2025-07-12 09:20:00');

    -- August 2025 order
    INSERT INTO orders (buyer_id, order_number, total_amount, final_amount, order_status, payment_status, payment_method, shipping_address_id, created_at)
    VALUES (b2, nextval('order_number_seq')::text, 285.00, 285.00, 'delivered', 'paid', 'card', (SELECT address_id FROM user_addresses WHERE user_id = b2 LIMIT 1), '2025-08-08 11:32:00') RETURNING order_id INTO o_id;
    INSERT INTO order_items (order_id, product_id, seller_id, quantity, unit_price, total_price, created_at)
    VALUES (o_id, p2, (SELECT seller_id FROM products WHERE product_id = p2), 3, 95.00, 285.00, '2025-08-08 11:32:00');

    -- Additional August 2025 order for seller1 (to ensure seller1 has orders in Aug)
    INSERT INTO orders (buyer_id, order_number, total_amount, final_amount, order_status, payment_status, payment_method, shipping_address_id, created_at)
    VALUES (b3, nextval('order_number_seq')::text, 150.00, 150.00, 'delivered', 'paid', 'card', (SELECT address_id FROM user_addresses WHERE user_id = b3 LIMIT 1), '2025-08-20 13:10:00') RETURNING order_id INTO o_id;
    INSERT INTO order_items (order_id, product_id, seller_id, quantity, unit_price, total_price, created_at)
    VALUES (o_id, p1, (SELECT seller_id FROM products WHERE product_id = p1), 1, 150.00, 150.00, '2025-08-20 13:10:00');

    -- September 2025 order
    INSERT INTO orders (buyer_id, order_number, total_amount, final_amount, order_status, payment_status, payment_method, shipping_address_id, created_at)
    VALUES (b3, nextval('order_number_seq')::text, 120.00, 120.00, 'delivered', 'paid', 'card', (SELECT address_id FROM user_addresses WHERE user_id = b3 LIMIT 1), '2025-09-05 14:00:00') RETURNING order_id INTO o_id;
    INSERT INTO order_items (order_id, product_id, seller_id, quantity, unit_price, total_price, created_at)
    VALUES (o_id, p3, (SELECT seller_id FROM products WHERE product_id = p3), 1, 120.00, 120.00, '2025-09-05 14:00:00');

    -- Additional September 2025 order for seller1 (to ensure seller1 has orders in Sep)
    INSERT INTO orders (buyer_id, order_number, total_amount, final_amount, order_status, payment_status, payment_method, shipping_address_id, created_at)
    VALUES (b1, nextval('order_number_seq')::text, 300.00, 300.00, 'delivered', 'paid', 'card', (SELECT address_id FROM user_addresses WHERE user_id = b1 LIMIT 1), '2025-09-21 09:45:00') RETURNING order_id INTO o_id;
    INSERT INTO order_items (order_id, product_id, seller_id, quantity, unit_price, total_price, created_at)
    VALUES (o_id, p1, (SELECT seller_id FROM products WHERE product_id = p1), 2, 150.00, 300.00, '2025-09-21 09:45:00');

    -- October 2025 order (mixed items)
    INSERT INTO orders (buyer_id, order_number, total_amount, final_amount, order_status, payment_status, payment_method, shipping_address_id, created_at)
    VALUES (b1, nextval('order_number_seq')::text, 430.00, 430.00, 'delivered', 'paid', 'card', (SELECT address_id FROM user_addresses WHERE user_id = b1 LIMIT 1), '2025-10-20 08:15:00') RETURNING order_id INTO o_id;
    INSERT INTO order_items (order_id, product_id, seller_id, quantity, unit_price, total_price, created_at)
    VALUES (o_id, p1, (SELECT seller_id FROM products WHERE product_id = p1), 1, 150.00, 150.00, '2025-10-20 08:15:00');
    INSERT INTO order_items (order_id, product_id, seller_id, quantity, unit_price, total_price, created_at)
    VALUES (o_id, p2, (SELECT seller_id FROM products WHERE product_id = p2), 1, 95.00, 95.00, '2025-10-20 08:15:00');
    INSERT INTO order_items (order_id, product_id, seller_id, quantity, unit_price, total_price, created_at)
    VALUES (o_id, p3, (SELECT seller_id FROM products WHERE product_id = p3), 1, 185.00, 185.00, '2025-10-20 08:15:00');

    -- November 2025 order
    INSERT INTO orders (buyer_id, order_number, total_amount, final_amount, order_status, payment_status, payment_method, shipping_address_id, created_at)
    VALUES (b2, nextval('order_number_seq')::text, 200.00, 200.00, 'delivered', 'paid', 'card', (SELECT address_id FROM user_addresses WHERE user_id = b2 LIMIT 1), '2025-11-07 16:40:00') RETURNING order_id INTO o_id;
    INSERT INTO order_items (order_id, product_id, seller_id, quantity, unit_price, total_price, created_at)
    VALUES (o_id, p2, (SELECT seller_id FROM products WHERE product_id = p2), 2, 95.00, 190.00, '2025-11-07 16:40:00');
    INSERT INTO order_items (order_id, product_id, seller_id, quantity, unit_price, total_price, created_at)
    VALUES (o_id, p3, (SELECT seller_id FROM products WHERE product_id = p3), 1, 10.00, 10.00, '2025-11-07 16:40:00');

    -- Additional November 2025 order for seller1 (to ensure seller1 has orders in Nov)
    INSERT INTO orders (buyer_id, order_number, total_amount, final_amount, order_status, payment_status, payment_method, shipping_address_id, created_at)
    VALUES (b3, nextval('order_number_seq')::text, 150.00, 150.00, 'delivered', 'paid', 'card', (SELECT address_id FROM user_addresses WHERE user_id = b3 LIMIT 1), '2025-11-20 12:00:00') RETURNING order_id INTO o_id;
    INSERT INTO order_items (order_id, product_id, seller_id, quantity, unit_price, total_price, created_at)
    VALUES (o_id, p1, (SELECT seller_id FROM products WHERE product_id = p1), 1, 150.00, 150.00, '2025-11-20 12:00:00');

    -- December 2025 order
    INSERT INTO orders (buyer_id, order_number, total_amount, final_amount, order_status, payment_status, payment_method, shipping_address_id, created_at)
    VALUES (b1, nextval('order_number_seq')::text, 470.00, 470.00, 'delivered', 'paid', 'card', (SELECT address_id FROM user_addresses WHERE user_id = b1 LIMIT 1), '2025-12-02 10:00:00') RETURNING order_id INTO o_id;
    INSERT INTO order_items (order_id, product_id, seller_id, quantity, unit_price, total_price, created_at)
    VALUES (o_id, p1, (SELECT seller_id FROM products WHERE product_id = p1), 2, 150.00, 300.00, '2025-12-02 10:00:00');
    INSERT INTO order_items (order_id, product_id, seller_id, quantity, unit_price, total_price, created_at)
    VALUES (o_id, p2, (SELECT seller_id FROM products WHERE product_id = p2), 1, 170.00, 170.00, '2025-12-02 10:00:00');

    -- Update product totals (optional)
    UPDATE products SET total_sales = COALESCE((SELECT SUM(oi.quantity) FROM order_items oi WHERE oi.product_id = products.product_id), 0);
END $$;

COMMIT;
