# PineMarket - Installation & Setup Guide

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v16 or higher)
- **PostgreSQL** (v13 or higher)
- **npm** or **yarn**
- **Git**

For mobile development:
- **React Native CLI** or **Expo CLI**
- **Android Studio** (for Android development)
- **Xcode** (for iOS development, Mac only)

## Database Setup

### 1. Install PostgreSQL

Download and install PostgreSQL from https://www.postgresql.org/download/

### 2. Create Database

```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE pinemarket;

# Connect to database
\c pinemarket

# Exit
\q
```

### 3. Initialize Database Schema

```bash
# Navigate to database directory
cd database

# Run schema creation
psql -U postgres -d pinemarket -f schema.sql

# Run seed data (optional, for testing)
psql -U postgres -d pinemarket -f seed.sql
```

## Backend Setup

### 1. Navigate to Backend Directory

```bash
cd backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

```bash
# Copy example env file
cp .env.example .env

# Edit .env file with your settings
```

Update the following in `.env`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pinemarket
DB_USER=postgres
DB_PASSWORD=your_postgres_password

JWT_SECRET=your_secret_key_here_change_this
```

### 4. Start Backend Server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

The API will be available at `http://localhost:3000`

Test the API: `http://localhost:3000/health`

## Mobile App Setup

### 1. Navigate to Mobile Directory

```bash
cd mobile
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure API URL

Edit `mobile/src/services/api.js`:
```javascript
// Change this to your backend URL
const API_BASE_URL = 'http://localhost:3000/api';

// For real device testing, use your computer's IP:
// const API_BASE_URL = 'http://192.168.1.X:3000/api';
```

### 4. Start Mobile App

#### Using Expo (Recommended for beginners):

```bash
npm start
```

Then:
- Press `a` for Android emulator
- Press `i` for iOS simulator (Mac only)
- Scan QR code with Expo Go app on your physical device

#### Using React Native CLI:

```bash
# For Android
npm run android

# For iOS (Mac only)
npm run ios
```

## Testing the Application

### 1. Test Backend API

```bash
# Health check
curl http://localhost:3000/health

# Register user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User",
    "userType": "buyer"
  }'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Get products
curl http://localhost:3000/api/products
```

### 2. Test Mobile App

1. Open the app
2. Register a new account
3. Login with credentials
4. Browse products
5. Add items to cart
6. Proceed to checkout

## Common Issues and Solutions

### Database Connection Error

**Error**: `connection refused` or `authentication failed`

**Solution**:
- Verify PostgreSQL is running: `sudo service postgresql status`
- Check credentials in `.env` file
- Ensure database exists: `psql -U postgres -l`

### Mobile App Can't Connect to Backend

**Error**: Network request failed

**Solution**:
- Make sure backend is running
- Use correct IP address (not localhost on real devices)
- Check firewall settings
- For Android emulator, use `10.0.2.2` instead of localhost

### Port Already in Use

**Error**: `EADDRINUSE: address already in use`

**Solution**:
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Or change port in .env
PORT=3001
```

### React Native Build Errors

**Solution**:
```bash
# Clear caches
cd mobile
rm -rf node_modules
npm install

# For Android
cd android
./gradlew clean
cd ..

# For iOS (Mac only)
cd ios
pod install
cd ..
```

## Development Tips

### Backend Development

- Use `npm run dev` for auto-restart on file changes
- Monitor logs for errors
- Use Postman or curl for API testing

### Mobile Development

- Use React DevTools for debugging
- Enable Fast Refresh for instant updates
- Check console logs in Expo or Metro Bundler

## Production Deployment

### Backend

1. Use environment-specific configurations
2. Enable HTTPS
3. Set secure JWT secret
4. Configure CORS properly
5. Use production-grade PostgreSQL instance
6. Set up monitoring and logging

### Mobile

1. Build production APK/IPA
2. Test on real devices
3. Submit to app stores (Google Play, Apple App Store)
4. Configure production API URLs

## Next Steps

- Implement remaining screens (Cart, Orders, Product Details)
- Add payment gateway integration
- Implement push notifications
- Add image upload for products
- Implement search and filters
- Add reviews and ratings functionality

## Support

For issues and questions:
- Check documentation
- Review error logs
- Search for similar issues online
- Contact development team

## License

This project is licensed under the MIT License.
