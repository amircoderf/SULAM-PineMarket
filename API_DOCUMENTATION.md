# PineMarket API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Authentication Endpoints

### Register User
Create a new user account.

**Endpoint:** `POST /auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+639171234567",
  "userType": "buyer"  // "buyer", "seller", or "both"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "userType": "buyer"
    },
    "token": "jwt_token_here"
  }
}
```

---

### Login
Authenticate user and receive token.

**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "userType": "buyer",
      "isVerified": true
    },
    "token": "jwt_token_here"
  }
}
```

---

### Get Profile
Get current user profile information.

**Endpoint:** `GET /auth/profile`

**Headers:** Requires authentication

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "user_id": "uuid",
      "email": "user@example.com",
      "phone": "+639171234567",
      "first_name": "John",
      "last_name": "Doe",
      "profile_image": null,
      "user_type": "buyer",
      "is_verified": true,
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

---

## Product Endpoints

### Get All Products
Retrieve list of products with filtering and pagination.

**Endpoint:** `GET /products`

**Query Parameters:**
- `page` (number) - Page number (default: 1)
- `limit` (number) - Items per page (default: 20)
- `category` (string) - Filter by category name
- `search` (string) - Search in product name and description
- `minPrice` (number) - Minimum price filter
- `maxPrice` (number) - Maximum price filter
- `isOrganic` (boolean) - Filter organic products
- `sortBy` (string) - Sort field: created_at, price, rating_average, total_sales
- `sortOrder` (string) - ASC or DESC (default: DESC)

**Example Request:**
```
GET /products?page=1&limit=10&category=Fresh%20Pineapples&sortBy=price&sortOrder=ASC
```

**Response:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "product_id": "uuid",
        "product_name": "Premium Queen Pineapple",
        "description": "Sweet and juicy...",
        "price": "150.00",
        "stock_quantity": 100,
        "unit": "piece",
        "weight": "1.50",
        "is_organic": true,
        "origin": "Bukidnon",
        "rating_average": "4.80",
        "total_reviews": 45,
        "total_sales": 230,
        "created_at": "2024-01-01T00:00:00.000Z",
        "category_name": "Fresh Pineapples",
        "seller_name": "Roberto Garcia",
        "business_name": "Golden Pineapple Farm",
        "image_url": "https://...",
        "is_favorite": false
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "pages": 5
    }
  }
}
```

---

### Get Product Details
Get detailed information about a specific product.

**Endpoint:** `GET /products/:id`

**Response:**
```json
{
  "success": true,
  "data": {
    "product": {
      "product_id": "uuid",
      "seller_id": "uuid",
      "category_id": "uuid",
      "product_name": "Premium Queen Pineapple",
      "description": "Sweet and juicy queen variety...",
      "price": "150.00",
      "stock_quantity": 100,
      "unit": "piece",
      "weight": "1.50",
      "product_status": "active",
      "is_organic": true,
      "origin": "Bukidnon",
      "harvest_date": "2024-01-15",
      "rating_average": "4.80",
      "total_reviews": 45,
      "total_sales": 230,
      "views_count": 567,
      "created_at": "2024-01-01T00:00:00.000Z",
      "category_name": "Fresh Pineapples",
      "seller_name": "Roberto Garcia",
      "seller_email": "seller1@example.com",
      "business_name": "Golden Pineapple Farm",
      "business_description": "Premium fresh pineapples...",
      "seller_rating": "4.85",
      "is_favorite": false,
      "images": [
        {
          "image_id": "uuid",
          "image_url": "https://...",
          "is_primary": true,
          "display_order": 0
        }
      ]
    }
  }
}
```

---

### Create Product
Create a new product (Seller only).

**Endpoint:** `POST /products`

**Headers:** Requires authentication (Seller)

**Request Body:**
```json
{
  "categoryId": "uuid",
  "productName": "Fresh Pineapple",
  "description": "Freshly harvested pineapples",
  "price": 150.00,
  "stockQuantity": 100,
  "unit": "piece",
  "weight": 1.5,
  "isOrganic": true,
  "origin": "Bukidnon",
  "harvestDate": "2024-01-15"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "product": {
      "product_id": "uuid",
      "seller_id": "uuid",
      "product_name": "Fresh Pineapple",
      "price": "150.00",
      "stock_quantity": 100,
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

---

### Update Product
Update an existing product (Seller - own products only).

**Endpoint:** `PUT /products/:id`

**Headers:** Requires authentication (Seller)

**Request Body:** (All fields optional)
```json
{
  "productName": "Updated Product Name",
  "price": 180.00,
  "stockQuantity": 120,
  "productStatus": "active"
}
```

---

### Delete Product
Delete a product (Seller - own products only).

**Endpoint:** `DELETE /products/:id`

**Headers:** Requires authentication (Seller)

**Response:**
```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

---

## Shopping Cart Endpoints

### Get Cart
Retrieve user's shopping cart.

**Endpoint:** `GET /cart`

**Headers:** Requires authentication

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "cart_id": "uuid",
        "product_id": "uuid",
        "product_name": "Premium Queen Pineapple",
        "price": "150.00",
        "quantity": 2,
        "unit": "piece",
        "stock_quantity": 100,
        "image_url": "https://...",
        "subtotal": "300.00",
        "added_at": "2024-01-01T00:00:00.000Z"
      }
    ],
    "summary": {
      "itemCount": 3,
      "total": "850.00"
    }
  }
}
```

---

### Add to Cart
Add a product to cart or update quantity if already exists.

**Endpoint:** `POST /cart`

**Headers:** Requires authentication

**Request Body:**
```json
{
  "productId": "uuid",
  "quantity": 2
}
```

**Response:**
```json
{
  "success": true,
  "message": "Item added to cart",
  "data": {
    "cart_id": "uuid",
    "user_id": "uuid",
    "product_id": "uuid",
    "quantity": 2,
    "added_at": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### Update Cart Item
Update quantity of a cart item.

**Endpoint:** `PUT /cart/:id`

**Headers:** Requires authentication

**Request Body:**
```json
{
  "quantity": 5
}
```

---

### Remove from Cart
Remove an item from cart.

**Endpoint:** `DELETE /cart/:id`

**Headers:** Requires authentication

**Response:**
```json
{
  "success": true,
  "message": "Item removed from cart"
}
```

---

### Clear Cart
Remove all items from cart.

**Endpoint:** `DELETE /cart`

**Headers:** Requires authentication

---

## Order Endpoints

### Create Order
Create a new order from cart items.

**Endpoint:** `POST /orders`

**Headers:** Requires authentication

**Request Body:**
```json
{
  "shippingAddressId": "uuid",
  "paymentMethod": "Cash on Delivery",
  "notes": "Please call before delivery"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "order": {
      "order_id": "uuid",
      "buyer_id": "uuid",
      "order_number": "PM-123456",
      "total_amount": "850.00",
      "shipping_fee": "50.00",
      "tax_amount": "102.00",
      "final_amount": "1002.00",
      "order_status": "pending",
      "payment_status": "pending",
      "payment_method": "Cash on Delivery",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

---

### Get Orders
Retrieve user's order history.

**Endpoint:** `GET /orders`

**Headers:** Requires authentication

**Query Parameters:**
- `page` (number) - Page number
- `limit` (number) - Items per page
- `status` (string) - Filter by order status

**Response:**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "order_id": "uuid",
        "order_number": "PM-123456",
        "total_amount": "850.00",
        "final_amount": "1002.00",
        "order_status": "pending",
        "payment_status": "pending",
        "created_at": "2024-01-01T00:00:00.000Z",
        "item_count": 3
      }
    ]
  }
}
```

---

### Get Order Details
Get detailed information about a specific order.

**Endpoint:** `GET /orders/:id`

**Headers:** Requires authentication

**Response:**
```json
{
  "success": true,
  "data": {
    "order": {
      "order_id": "uuid",
      "order_number": "PM-123456",
      "total_amount": "850.00",
      "shipping_fee": "50.00",
      "tax_amount": "102.00",
      "final_amount": "1002.00",
      "order_status": "pending",
      "payment_status": "pending",
      "payment_method": "Cash on Delivery",
      "notes": "Please call before delivery",
      "street_address": "123 Main Street",
      "city": "Manila",
      "state": "Metro Manila",
      "postal_code": "1000",
      "country": "Philippines",
      "created_at": "2024-01-01T00:00:00.000Z",
      "items": [
        {
          "order_item_id": "uuid",
          "product_id": "uuid",
          "product_name": "Premium Queen Pineapple",
          "quantity": 2,
          "unit": "piece",
          "unit_price": "150.00",
          "total_price": "300.00",
          "item_status": "pending",
          "image_url": "https://..."
        }
      ]
    }
  }
}
```

---

## Category Endpoints

### Get Categories
Retrieve all active product categories.

**Endpoint:** `GET /categories`

**Response:**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "category_id": "uuid",
        "category_name": "Fresh Pineapples",
        "description": "Fresh whole pineapples from local farms",
        "image_url": "https://..."
      }
    ]
  }
}
```

---

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "message": "Error description"
}
```

### Common Error Codes

- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

---

## Rate Limiting

API requests are limited to:
- **100 requests per 15 minutes** per IP address

Exceeding this limit returns:
```json
{
  "message": "Too many requests from this IP, please try again later."
}
```

---

## Best Practices

1. **Always include error handling** in your client code
2. **Store JWT tokens securely** (AsyncStorage, SecureStore)
3. **Validate input** before sending to API
4. **Use pagination** for large data sets
5. **Implement retry logic** for network failures
6. **Cache responses** when appropriate
