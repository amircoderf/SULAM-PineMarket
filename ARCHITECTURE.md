# PineMarket System Architecture

## High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         MOBILE APP                              │
│                    (React Native + Expo)                        │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   Screens    │  │   Context    │  │  Services    │        │
│  │              │  │              │  │              │        │
│  │ - Auth       │  │ - AuthCtx    │  │ - API Client │        │
│  │ - Home       │◄─┤ - CartCtx    │◄─┤ - Axios      │        │
│  │ - Products   │  │              │  │              │        │
│  │ - Cart       │  │              │  │              │        │
│  │ - Profile    │  │              │  │              │        │
│  │ - Seller     │  │              │  │              │        │
│  └──────────────┘  └──────────────┘  └──────┬───────┘        │
│                                               │                │
└───────────────────────────────────────────────┼────────────────┘
                                                │
                                    HTTP/HTTPS (REST API)
                                                │
┌───────────────────────────────────────────────┼────────────────┐
│                       BACKEND API             │                │
│                  (Node.js + Express)          │                │
│                                               ▼                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                    Middleware Layer                      │ │
│  │                                                          │ │
│  │  ┌──────────┐  ┌──────────┐  ┌────────────┐           │ │
│  │  │   Auth   │  │  CORS    │  │   Rate     │           │ │
│  │  │   JWT    │  │  Helmet  │  │  Limiting  │           │ │
│  │  └──────────┘  └──────────┘  └────────────┘           │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                     Route Layer                          │ │
│  │                                                          │ │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐       │ │
│  │  │   Auth     │  │  Products  │  │    Cart    │       │ │
│  │  │  Routes    │  │   Routes   │  │   Routes   │       │ │
│  │  └────────────┘  └────────────┘  └────────────┘       │ │
│  │                                                          │ │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐       │ │
│  │  │   Orders   │  │ Categories │  │   Seller   │       │ │
│  │  │   Routes   │  │   Routes   │  │   Routes   │       │ │
│  │  └────────────┘  └────────────┘  └────────────┘       │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                   Database Layer                         │ │
│  │                                                          │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │         PostgreSQL Connection Pool              │  │ │
│  │  │  - Query Helper Functions                       │  │ │
│  │  │  - Transaction Support                          │  │ │
│  │  │  - Error Handling                               │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                │                               │
└────────────────────────────────┼───────────────────────────────┘
                                 │
                          SQL Queries
                                 │
                                 ▼
┌────────────────────────────────────────────────────────────────┐
│                    DATABASE                                    │
│                   (PostgreSQL)                                 │
│                                                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │  Users   │  │ Products │  │   Cart   │  │  Orders  │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
│                                                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │Categories│  │  Seller  │  │ Reviews  │  │ Favorites│    │
│  │          │  │ Profiles │  │          │  │          │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
│                                                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ Product  │  │  Order   │  │  User    │  │  Notify  │    │
│  │  Images  │  │  Items   │  │Addresses │  │ cations  │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
└────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagrams

### User Authentication Flow

```
┌─────────┐      ┌─────────┐      ┌──────────┐      ┌──────────┐
│  User   │      │ Mobile  │      │  Backend │      │ Database │
│         │      │   App   │      │    API   │      │          │
└────┬────┘      └────┬────┘      └────┬─────┘      └────┬─────┘
     │                │                 │                 │
     │  Enter Login   │                 │                 │
     │  Credentials   │                 │                 │
     ├───────────────►│                 │                 │
     │                │ POST /auth/login│                 │
     │                ├────────────────►│                 │
     │                │                 │ Query user      │
     │                │                 ├────────────────►│
     │                │                 │                 │
     │                │                 │ User data       │
     │                │                 │◄────────────────┤
     │                │                 │                 │
     │                │                 │ Verify password │
     │                │                 │ Generate JWT    │
     │                │                 │                 │
     │                │ JWT Token       │                 │
     │                │◄────────────────┤                 │
     │                │                 │                 │
     │                │ Store token     │                 │
     │                │ in AsyncStorage │                 │
     │                │                 │                 │
     │  Login Success │                 │                 │
     │◄───────────────┤                 │                 │
     │                │                 │                 │
```

### Product Purchase Flow

```
┌─────────┐      ┌─────────┐      ┌──────────┐      ┌──────────┐
│  Buyer  │      │ Mobile  │      │  Backend │      │ Database │
│         │      │   App   │      │    API   │      │          │
└────┬────┘      └────┬────┘      └────┬─────┘      └────┬─────┘
     │                │                 │                 │
     │  Browse        │ GET /products   │                 │
     │  Products      ├────────────────►│                 │
     │                │                 │ Fetch products  │
     │                │                 ├────────────────►│
     │                │                 │                 │
     │                │ Product list    │ Product data    │
     │                │◄────────────────┤◄────────────────┤
     │                │                 │                 │
     │  Add to Cart   │ POST /cart      │                 │
     ├───────────────►├────────────────►│                 │
     │                │                 │ Insert cart item│
     │                │                 ├────────────────►│
     │                │                 │                 │
     │                │ Cart updated    │ Success         │
     │                │◄────────────────┤◄────────────────┤
     │                │                 │                 │
     │  Checkout      │ POST /orders    │                 │
     ├───────────────►├────────────────►│                 │
     │                │                 │ BEGIN           │
     │                │                 │ TRANSACTION     │
     │                │                 │                 │
     │                │                 │ Create order    │
     │                │                 ├────────────────►│
     │                │                 │                 │
     │                │                 │ Create items    │
     │                │                 ├────────────────►│
     │                │                 │                 │
     │                │                 │ Update stock    │
     │                │                 ├────────────────►│
     │                │                 │                 │
     │                │                 │ Clear cart      │
     │                │                 ├────────────────►│
     │                │                 │                 │
     │                │                 │ COMMIT          │
     │                │                 │                 │
     │                │ Order confirmed │ Success         │
     │                │◄────────────────┤◄────────────────┤
     │  Order Receipt │                 │                 │
     │◄───────────────┤                 │                 │
     │                │                 │                 │
```

### Seller Product Management Flow

```
┌─────────┐      ┌─────────┐      ┌──────────┐      ┌──────────┐
│ Seller  │      │ Mobile  │      │  Backend │      │ Database │
│         │      │   App   │      │    API   │      │          │
└────┬────┘      └────┬────┘      └────┬─────┘      └────┬─────┘
     │                │                 │                 │
     │  Add Product   │ POST /products  │                 │
     │  Form          │ + JWT Token     │                 │
     ├───────────────►├────────────────►│                 │
     │                │                 │ Verify JWT      │
     │                │                 │ Check isSeller  │
     │                │                 │                 │
     │                │                 │ Insert product  │
     │                │                 ├────────────────►│
     │                │                 │                 │
     │                │                 │ Update seller   │
     │                │                 │ product count   │
     │                │                 ├────────────────►│
     │                │                 │                 │
     │                │ Product created │ Success         │
     │                │◄────────────────┤◄────────────────┤
     │  Success       │                 │                 │
     │  Message       │                 │                 │
     │◄───────────────┤                 │                 │
     │                │                 │                 │
```

## Component Architecture

### Mobile App Component Hierarchy

```
App.js
│
├── PaperProvider (UI Theme)
│   │
│   ├── AuthProvider (Authentication State)
│   │   │
│   │   ├── CartProvider (Cart State)
│   │   │   │
│   │   │   └── NavigationContainer
│   │   │       │
│   │   │       ├── AuthStack (if not authenticated)
│   │   │       │   ├── LoginScreen
│   │   │       │   └── RegisterScreen
│   │   │       │
│   │   │       └── MainTabs (if authenticated)
│   │   │           │
│   │   │           ├── Home Tab
│   │   │           │   └── HomeStack
│   │   │           │       ├── HomeScreen
│   │   │           │       ├── ProductListScreen
│   │   │           │       └── ProductDetailScreen
│   │   │           │
│   │   │           ├── Cart Tab
│   │   │           │   └── CartStack
│   │   │           │       └── CartScreen
│   │   │           │
│   │   │           ├── Seller Tab (if seller)
│   │   │           │   └── SellerStack
│   │   │           │       ├── SellerDashboardScreen
│   │   │           │       └── AddProductScreen
│   │   │           │
│   │   │           └── Profile Tab
│   │   │               └── ProfileStack
│   │   │                   ├── ProfileScreen
│   │   │                   └── OrdersScreen
```

## Database Relationships

```
┌─────────────┐
│    Users    │
└──────┬──────┘
       │
       ├──────────────────────┬────────────────────┐
       │                      │                    │
       ▼                      ▼                    ▼
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Seller    │      │    Cart     │      │   Orders    │
│  Profiles   │      └─────┬───────┘      └──────┬──────┘
└──────┬──────┘            │                     │
       │                   │                     │
       ▼                   ▼                     ▼
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│  Products   │◄─────┤  Products   │      │ Order Items │
└──────┬──────┘      └─────────────┘      └──────┬──────┘
       │                                           │
       ├──────────────┬────────────┐              │
       ▼              ▼            ▼              ▼
┌─────────────┐ ┌──────────┐ ┌─────────┐   ┌─────────────┐
│   Product   │ │ Reviews  │ │Favorites│   │  Products   │
│   Images    │ └──────────┘ └─────────┘   │  (ref)      │
└─────────────┘                             └─────────────┘
       │
       └───► Categories
```

## Security Layers

```
┌────────────────────────────────────────────────────────────┐
│                    Request Layer                           │
├────────────────────────────────────────────────────────────┤
│ 1. Rate Limiting (100 req/15min)                          │
│ 2. CORS Validation                                         │
│ 3. Helmet Security Headers                                │
└────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────┐
│                 Authentication Layer                       │
├────────────────────────────────────────────────────────────┤
│ 1. JWT Token Verification                                 │
│ 2. Token Expiration Check                                 │
│ 3. User Status Verification                               │
└────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────┐
│                 Authorization Layer                        │
├────────────────────────────────────────────────────────────┤
│ 1. Role Verification (buyer/seller)                       │
│ 2. Resource Ownership Check                               │
│ 3. Permission Validation                                  │
└────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────┐
│                  Validation Layer                          │
├────────────────────────────────────────────────────────────┤
│ 1. Input Validation (express-validator)                   │
│ 2. Data Sanitization                                       │
│ 3. Type Checking                                           │
└────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────┐
│                   Database Layer                           │
├────────────────────────────────────────────────────────────┤
│ 1. Parameterized Queries (SQL Injection Prevention)       │
│ 2. Foreign Key Constraints                                │
│ 3. Transaction Management                                 │
└────────────────────────────────────────────────────────────┘
```

## State Management Flow (Mobile)

```
┌─────────────────────────────────────────────────────────┐
│                    User Actions                         │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│                  Context Actions                        │
│  (login, logout, addToCart, removeFromCart, etc.)      │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│                   API Services                          │
│         (Axios calls to backend API)                    │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│              Update Context State                       │
│    (setUser, setCart, setLoading, etc.)                │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│              Re-render Components                       │
│       (UI updates automatically)                        │
└─────────────────────────────────────────────────────────┘
```

## Deployment Architecture (Future)

```
┌──────────────────────────────────────────────────────────┐
│                    Cloud Platform                        │
│              (AWS, Google Cloud, Azure)                  │
│                                                          │
│  ┌────────────────┐  ┌────────────────┐                │
│  │   Mobile App   │  │   Backend API  │                │
│  │   Hosting      │  │   (Container)  │                │
│  │   (CDN)        │  │                │                │
│  └────────────────┘  └───────┬────────┘                │
│                              │                          │
│                              │                          │
│  ┌────────────────┐  ┌───────▼────────┐                │
│  │   Database     │  │  Load Balancer │                │
│  │   (Managed)    │  │                │                │
│  │   PostgreSQL   │  └────────────────┘                │
│  └────────────────┘                                     │
│                                                          │
│  ┌────────────────┐  ┌────────────────┐                │
│  │  File Storage  │  │   Monitoring   │                │
│  │  (S3/Blob)     │  │   & Logging    │                │
│  └────────────────┘  └────────────────┘                │
└──────────────────────────────────────────────────────────┘
```

---

**This architecture provides a solid foundation for a scalable, secure, and maintainable marketplace application.**
