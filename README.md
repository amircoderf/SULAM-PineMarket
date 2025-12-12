# PineMarket - Pineapple Products Marketplace

## Project Overview
A comprehensive mobile marketplace system for pineapple-based products where users can both buy and sell products.

## Key Features

### User Features
- **User Registration & Authentication**
  - Sign up with email/phone
  - Login/Logout functionality
  - Profile management

### Buyer Features
- Browse pineapple products
- Search and filter products
- View product details
- Add to cart
- Place orders
- Track order status
- Rate and review products
- Save favorite products

### Seller Features
- Register as a seller
- Add new products
- Manage product inventory
- Update product details
- View sales analytics
- Process orders
- Manage pricing

### Product Categories
- Fresh Pineapples
- Pineapple Juice
- Dried Pineapple
- Pineapple Jam/Preserves
- Pineapple Desserts
- Pineapple-based Cosmetics
- Other Pineapple Products

## Technology Stack

### Mobile App
- **Framework**: React Native (cross-platform)
- **State Management**: Redux/Context API
- **Navigation**: React Navigation
- **UI Components**: React Native Paper/Native Base

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **API**: RESTful API
- **Authentication**: JWT (JSON Web Tokens)

### Database
- **Primary Database**: PostgreSQL
- **File Storage**: Local storage


## Installation & Setup

### Prerequisites
- Node.js (v16+)
- PostgreSQL (v13+)
- npm or yarn
- React Native CLI
- Android Studio / Xcode

### Backend Setup
```bash
cd backend
npm install
# Configure .env file
npm run migrate
npm start
```

### Mobile App Setup
```bash
cd mobile
npm install
# For iOS
cd ios && pod install && cd ..
npm run ios
# For Android
npm run android
```

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - User login
- POST `/api/auth/logout` - User logout
- GET `/api/auth/profile` - Get user profile

### Products
- GET `/api/products` - Get all products
- GET `/api/products/:id` - Get product details
- POST `/api/products` - Create product (seller)
- PUT `/api/products/:id` - Update product (seller)
- DELETE `/api/products/:id` - Delete product (seller)

### Orders
- POST `/api/orders` - Create order
- GET `/api/orders` - Get user orders
- GET `/api/orders/:id` - Get order details
- PUT `/api/orders/:id/status` - Update order status

### Cart
- GET `/api/cart` - Get cart items
- POST `/api/cart` - Add to cart
- PUT `/api/cart/:id` - Update cart item
- DELETE `/api/cart/:id` - Remove from cart

## Database Schema
See `database/schema.sql` for complete database structure.

## Security Features
- Password hashing (bcrypt)
- JWT authentication
- Input validation
- SQL injection prevention
- Rate limiting
- CORS configuration

## Future Enhancements
- Payment gateway integration
- Push notifications
- In-app chat between buyers and sellers
- Advanced analytics dashboard
- Location-based product search
- Social media integration
