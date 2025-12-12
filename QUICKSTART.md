# 🍍 PineMarket - Quick Start Guide

## Get Started in 5 Minutes!

This guide will help you get PineMarket up and running quickly.

### Prerequisites Checklist
- [ ] Node.js installed (v16+)
- [ ] PostgreSQL installed (v13+)
- [ ] Git installed

---

## Step 1: Setup Database (2 minutes)

```powershell
# Start PostgreSQL service (if not running)
# On Windows: Check Services or use:
# net start postgresql-x64-13

# Create database
psql -U postgres -c "CREATE DATABASE pinemarket;"

# Initialize schema
cd database
psql -U postgres -d pinemarket -f schema.sql

# (Optional) Load sample data
psql -U postgres -d pinemarket -f seed.sql
```

---

## Step 2: Setup Backend (1 minute)

```powershell
cd backend

# Install dependencies
npm install

# Create .env file
Copy-Item .env.example .env

# Edit .env and set your database password
# notepad .env

# Start backend server
npm run dev
```

Backend will run at: http://localhost:3000

Test it: http://localhost:3000/health

---

## Step 3: Setup Mobile App (2 minutes)

```powershell
cd mobile

# Install dependencies
npm install

# Start the app
npm start
```

Then:
- Press `a` for Android emulator
- Press `i` for iOS simulator (Mac only)
- Or scan QR code with Expo Go app

---

## Step 4: Test the App

### Using Sample Data (if you loaded seed.sql):

**Login credentials:**
- **Buyer Account:**
  - Email: `buyer1@example.com`
  - Password: `password123`

- **Seller Account:**
  - Email: `seller1@example.com`
  - Password: `password123`

### Or Create New Account:
1. Open the mobile app
2. Click "Register"
3. Fill in your details
4. Select user type (buyer/seller/both)
5. Register and login

---

## Quick Commands Reference

### Backend
```powershell
cd backend
npm run dev      # Start development server
npm start        # Start production server
```

### Mobile
```powershell
cd mobile
npm start        # Start Expo
npm run android  # Run on Android
npm run ios      # Run on iOS (Mac only)
```

### Database
```powershell
# Connect to database
psql -U postgres -d pinemarket

# View tables
\dt

# View users
SELECT email, first_name, user_type FROM users;

# View products
SELECT product_name, price, stock_quantity FROM products;
```

---

## Troubleshooting

### Backend won't start?
- Check if PostgreSQL is running
- Verify .env database credentials
- Check if port 3000 is available

### Mobile app can't connect?
- Make sure backend is running
- On real device, change API_BASE_URL in `mobile/src/services/api.js` to your computer's IP
- Example: `http://192.168.1.100:3000/api`

### Database connection error?
```powershell
# Check PostgreSQL status
# Windows: Check in Services

# Verify database exists
psql -U postgres -l
```

---

## What's Next?

1. ✅ **Explore the app** - Browse products, add to cart
2. ✅ **Test seller features** - Add products (if registered as seller)
3. ✅ **Check the API** - Use Postman or curl to test endpoints
4. ✅ **Read full documentation** - See README.md and SETUP.md

---

## Project Structure Quick Reference

```
pinemarket/
├── database/           # Database schema and seed data
├── backend/           # Node.js/Express API
│   └── src/
│       ├── routes/    # API endpoints
│       └── config/    # Configuration
└── mobile/            # React Native app
    └── src/
        ├── screens/   # App screens
        ├── context/   # State management
        └── services/  # API client
```

---

## Key Features to Test

### As a Buyer:
- ✨ Browse products by category
- 🔍 Search for products
- 🛒 Add items to cart
- 📦 Place orders
- ⭐ View product ratings

### As a Seller:
- ➕ Add new products
- ✏️ Edit product details
- 📊 View sales dashboard
- 📦 Manage inventory

---

## Support & Documentation

- 📖 **Full Setup Guide**: [SETUP.md](SETUP.md)
- 📚 **API Documentation**: [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
- 🏗️ **Project Structure**: [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)
- 📋 **Main README**: [README.md](README.md)

---

## Need Help?

1. Check error messages in terminal
2. Review the documentation files
3. Check if all services are running
4. Verify your .env configuration

---

**Happy coding! 🍍**
