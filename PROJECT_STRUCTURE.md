# PineMarket - Project Structure

## Overview
Complete directory structure of the PineMarket application.

```
pinemarket/
│
├── README.md                    # Project overview and features
├── SETUP.md                     # Installation and setup instructions
│
├── database/                    # Database files
│   ├── schema.sql              # PostgreSQL database schema
│   └── seed.sql                # Sample data for testing
│
├── backend/                     # Node.js/Express backend
│   ├── package.json            # Backend dependencies
│   ├── .env.example            # Environment variables template
│   ├── src/
│   │   ├── server.js           # Express app entry point
│   │   ├── config/
│   │   │   └── database.js     # Database connection config
│   │   ├── middleware/
│   │   │   └── auth.js         # Authentication middleware
│   │   └── routes/
│   │       ├── authRoutes.js   # Authentication endpoints
│   │       ├── productRoutes.js # Product management
│   │       ├── cartRoutes.js   # Shopping cart
│   │       ├── orderRoutes.js  # Order management
│   │       ├── categoryRoutes.js # Product categories
│   │       ├── reviewRoutes.js # Product reviews
│   │       ├── sellerRoutes.js # Seller functionality
│   │       └── userRoutes.js   # User management
│   └── uploads/                # Uploaded files storage
│
└── mobile/                      # React Native mobile app
    ├── package.json            # Mobile app dependencies
    ├── App.js                  # App entry point
    ├── app.json                # Expo configuration
    ├── src/
    │   ├── theme.js            # App theme and styling
    │   ├── context/
    │   │   ├── AuthContext.js  # Authentication state management
    │   │   └── CartContext.js  # Cart state management
    │   ├── navigation/
    │   │   └── AppNavigator.js # Navigation configuration
    │   ├── services/
    │   │   └── api.js          # API client and endpoints
    │   ├── screens/
    │   │   ├── auth/
    │   │   │   ├── LoginScreen.js    # Login screen
    │   │   │   └── RegisterScreen.js # Registration screen
    │   │   ├── seller/
    │   │   │   ├── SellerDashboardScreen.js # Seller dashboard
    │   │   │   └── AddProductScreen.js      # Add product form
    │   │   ├── HomeScreen.js         # Home/landing screen
    │   │   ├── ProductListScreen.js  # Product listing
    │   │   ├── ProductDetailScreen.js # Product details
    │   │   ├── CartScreen.js         # Shopping cart
    │   │   ├── ProfileScreen.js      # User profile
    │   │   └── OrdersScreen.js       # Order history
    │   └── components/               # Reusable components
    └── assets/                       # Images, fonts, etc.
```

## Key Components

### Backend (Node.js/Express)

#### Core Technologies
- **Express.js** - Web framework
- **PostgreSQL** - Database
- **JWT** - Authentication
- **bcrypt** - Password hashing

#### API Structure
- RESTful API design
- JWT-based authentication
- Request validation
- Error handling
- Rate limiting

#### Database
- PostgreSQL with UUID primary keys
- Foreign key relationships
- Indexes for performance
- Triggers for automated updates

### Mobile App (React Native)

#### Core Technologies
- **React Native** - Mobile framework
- **Expo** - Development platform
- **React Navigation** - Navigation
- **React Native Paper** - UI components
- **Axios** - HTTP client

#### State Management
- React Context API
- AsyncStorage for persistence

#### Navigation Structure
- Stack navigation for screen flow
- Bottom tab navigation for main sections
- Conditional navigation based on auth state

## Features by Module

### Authentication Module
- User registration
- User login/logout
- Profile management
- JWT token handling
- Role-based access (buyer/seller)

### Product Module
- Product listing with pagination
- Product search and filtering
- Category-based browsing
- Product details view
- Seller product management (CRUD)

### Shopping Cart Module
- Add items to cart
- Update quantities
- Remove items
- Cart persistence
- Real-time total calculation

### Order Module
- Checkout process
- Order creation
- Order history
- Order tracking
- Order status updates

### Seller Module
- Seller dashboard
- Product management
- Sales analytics
- Inventory management

## Database Tables

### Core Tables
- `users` - User accounts
- `seller_profiles` - Seller information
- `products` - Product catalog
- `categories` - Product categories
- `cart` - Shopping cart items
- `orders` - Order records
- `order_items` - Order line items
- `reviews` - Product reviews
- `user_addresses` - Delivery addresses
- `favorites` - Wishlist items
- `notifications` - User notifications
- `product_images` - Product photos

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Get profile
- `PUT /api/auth/profile` - Update profile

### Products
- `GET /api/products` - List products
- `GET /api/products/:id` - Get product
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Cart
- `GET /api/cart` - Get cart
- `POST /api/cart` - Add to cart
- `PUT /api/cart/:id` - Update item
- `DELETE /api/cart/:id` - Remove item

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders` - List orders
- `GET /api/orders/:id` - Get order

### Categories
- `GET /api/categories` - List categories

## Screen Flow

```
App Start
    ├── Not Authenticated → Auth Stack
    │   ├── Login Screen
    │   └── Register Screen
    │
    └── Authenticated → Main Tabs
        ├── Home Tab (Stack)
        │   ├── Home Screen
        │   ├── Product List Screen
        │   └── Product Detail Screen
        │
        ├── Cart Tab
        │   └── Cart Screen
        │
        ├── Seller Tab (if seller)
        │   ├── Seller Dashboard
        │   └── Add Product Screen
        │
        └── Profile Tab (Stack)
            ├── Profile Screen
            └── Orders Screen
```

## Future Enhancements

### Short Term
- Complete all placeholder screens
- Add image upload functionality
- Implement reviews system
- Add favorites/wishlist
- Implement search with filters

### Medium Term
- Payment gateway integration
- Push notifications
- Real-time chat between buyers/sellers
- Advanced analytics for sellers
- Multi-language support

### Long Term
- AI-powered product recommendations
- Social features (share, follow sellers)
- Subscription plans
- Mobile app optimization
- Web version of the app
