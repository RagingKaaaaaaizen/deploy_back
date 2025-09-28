# Postman Testing Guide for Computer Lab Inventory Management System

## 🚀 Getting Started

### 1. Start the Server
```bash
cd C:/Users/Lenovo/Documents/testing/deploy_back
npm run start:dev
```

The server will run on: `http://localhost:4000`

### 2. Open Postman
- Download Postman if you haven't already
- Create a new workspace called "Computer Lab Inventory API"

---

## 🔧 Basic Health Checks

### Test 1: Server Health Check
**Method:** `GET`  
**URL:** `http://localhost:4000/health`  
**Headers:** None required  
**Expected Response:**
```json
{
    "status": "OK",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "uptime": 123.456,
    "environment": "development"
}
```

### Test 2: API Test Endpoint
**Method:** `GET`  
**URL:** `http://localhost:4000/api/test`  
**Headers:** None required  
**Expected Response:**
```json
{
    "message": "Server is working!",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "status": "OK"
}
```

### Test 3: Database Connection Test
**Method:** `GET`  
**URL:** `http://localhost:4000/api/accounts-test`  
**Headers:** None required  
**Expected Response:**
```json
{
    "message": "Accounts test endpoint",
    "accountCount": 4,
    "timestamp": "2024-01-15T10:30:00.000Z",
    "status": "OK"
}
```

---

## 🔐 Authentication Testing

### Test 4: User Registration
**Method:** `POST`  
**URL:** `http://localhost:4000/api/accounts/register`  
**Headers:** `Content-Type: application/json`  
**Body (JSON):**
```json
{
    "title": "Mr.",
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "password": "password123",
    "confirmPassword": "password123",
    "acceptTerms": true
}
```

### Test 5: User Login
**Method:** `POST`  
**URL:** `http://localhost:4000/api/accounts/authenticate`  
**Headers:** `Content-Type: application/json`  
**Body (JSON):**
```json
{
    "email": "admin@example.com",
    "password": "admin123"
}
```

**Expected Response:**
```json
{
    "id": 1,
    "title": "Mr.",
    "firstName": "Admin",
    "lastName": "User",
    "email": "admin@example.com",
    "role": "SuperAdmin",
    "status": "Active",
    "isVerified": true,
    "jwtToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh_token_here"
}
```

**Save the `jwtToken` for authenticated requests!**

---

## 📊 Data Retrieval Testing

### Test 6: Get All Brands
**Method:** `GET`  
**URL:** `http://localhost:4000/api/brands`  
**Headers:** `Authorization: Bearer YOUR_JWT_TOKEN_HERE`  
**Expected Response:**
```json
[
    {
        "id": 1,
        "name": "Intel",
        "description": "Intel Corporation - CPU and chipset manufacturer"
    },
    {
        "id": 2,
        "name": "AMD",
        "description": "Advanced Micro Devices - CPU and GPU manufacturer"
    }
]
```

### Test 7: Get All Categories
**Method:** `GET`  
**URL:** `http://localhost:4000/api/categories`  
**Headers:** `Authorization: Bearer YOUR_JWT_TOKEN_HERE`  

### Test 8: Get All Items
**Method:** `GET`  
**URL:** `http://localhost:4000/api/items`  
**Headers:** `Authorization: Bearer YOUR_JWT_TOKEN_HERE`  

### Test 9: Get All Stocks
**Method:** `GET`  
**URL:** `http://localhost:4000/api/stocks`  
**Headers:** `Authorization: Bearer YOUR_JWT_TOKEN_HERE`  

### Test 10: Get All Storage Locations
**Method:** `GET`  
**URL:** `http://localhost:4000/api/storage-locations`  
**Headers:** `Authorization: Bearer YOUR_JWT_TOKEN_HERE`  

### Test 11: Get All Room Locations
**Method:** `GET`  
**URL:** `http://localhost:4000/api/room-locations`  
**Headers:** `Authorization: Bearer YOUR_JWT_TOKEN_HERE`  

### Test 12: Get All PCs
**Method:** `GET`  
**URL:** `http://localhost:4000/api/pcs`  
**Headers:** `Authorization: Bearer YOUR_JWT_TOKEN_HERE`  

---

## 🔒 Authenticated Requests

**For all authenticated requests, add this header:**
```
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```

### Test 13: Create New Item (Authenticated)
**Method:** `POST`  
**URL:** `http://localhost:4000/api/items`  
**Headers:** 
- `Content-Type: application/json`
- `Authorization: Bearer YOUR_JWT_TOKEN_HERE`  
**Body (JSON):**
```json
{
    "categoryId": 1,
    "brandId": 1,
    "name": "Intel Core i9-13900K",
    "description": "13th Gen Intel Core i9 processor",
    "brandName": "Intel"
}
```

### Test 14: Create New Stock Entry (Authenticated)
**Method:** `POST`  
**URL:** `http://localhost:4000/api/stocks`  
**Headers:** 
- `Content-Type: application/json`
- `Authorization: Bearer YOUR_JWT_TOKEN_HERE`  
**Body (JSON):**
```json
{
    "itemId": 1,
    "quantity": 10,
    "locationId": 1,
    "price": 399.99,
    "totalPrice": 3999.90,
    "remarks": "New stock for lab expansion"
}
```

### Test 15: Create New PC (Authenticated)
**Method:** `POST`  
**URL:** `http://localhost:4000/api/pcs`  
**Headers:** 
- `Content-Type: application/json`
- `Authorization: Bearer YOUR_JWT_TOKEN_HERE`  
**Body (JSON):**
```json
{
    "name": "Test Gaming PC",
    "serialNumber": "PC-TEST-001",
    "roomLocationId": 1,
    "status": "Active",
    "assignedTo": "Test Lab",
    "notes": "Test PC for API testing"
}
```

---

## 📈 Advanced Testing

### Test 16: Get Dashboard Analytics
**Method:** `GET`  
**URL:** `http://localhost:4000/api/analytics/dashboard`  
**Headers:** `Authorization: Bearer YOUR_JWT_TOKEN_HERE`  

### Test 17: Get Category Distribution
**Method:** `GET`  
**URL:** `http://localhost:4000/api/analytics/category-distribution`  
**Headers:** `Authorization: Bearer YOUR_JWT_TOKEN_HERE`  

### Test 18: Get Low Stock Items (Admin Only)
**Method:** `GET`  
**URL:** `http://localhost:4000/api/analytics/low-stock-items`  
**Headers:** `Authorization: Bearer YOUR_JWT_TOKEN_HERE`  

### Test 19: Get Stock by Location (Admin Only)
**Method:** `GET`  
**URL:** `http://localhost:4000/api/analytics/stock-by-location`  
**Headers:** `Authorization: Bearer YOUR_JWT_TOKEN_HERE`  

### Test 20: Get Activity Logs
**Method:** `GET`  
**URL:** `http://localhost:4000/api/activity-logs`  
**Headers:** `Authorization: Bearer YOUR_JWT_TOKEN_HERE`  

### Test 21: Get Approval Requests
**Method:** `GET`  
**URL:** `http://localhost:4000/api/approval-requests`  
**Headers:** `Authorization: Bearer YOUR_JWT_TOKEN_HERE`  

### Test 22: Create Disposal Record (Authenticated)
**Method:** `POST`  
**URL:** `http://localhost:4000/api/dispose`  
**Headers:** 
- `Content-Type: application/json`
- `Authorization: Bearer YOUR_JWT_TOKEN_HERE`  
**Body (JSON):**
```json
{
    "stockEntryId": 1,
    "quantity": 2,
    "disposalValue": 20.00,
    "locationId": 1,
    "reason": "Old hard drives no longer needed"
}
```

**Note:** You need to use a valid `stockEntryId` from your stocks. First get your stocks with `GET /api/stocks` to see available stock entry IDs.

---

## 🔍 API Documentation

### Swagger UI
Visit: `http://localhost:4000/api-docs`

This provides interactive API documentation where you can test endpoints directly in the browser.

---

## 📝 Sample Data Available

The database now contains:

- **4 User Accounts:**
  - Admin: `admin@lab.com` / `password`
  - Manager: `manager@lab.com` / `password`
  - Technician: `tech@lab.com` / `password`
  - Viewer: `viewer@lab.com` / `password`

- **15 Brands:** Intel, AMD, NVIDIA, Samsung, etc.
- **14 Categories:** CPU, GPU, RAM, Storage, etc.
- **15 Items:** Various computer components
- **15 Stock Entries:** Inventory with quantities and prices
- **5 Room Locations:** Computer lab areas
- **2 Assembled PCs:** With components
- **Sample Activity Logs:** System activity records
- **Sample Approval Requests:** Workflow examples

---

## 🚨 Troubleshooting

### Common Issues:

1. **401 Unauthorized:** Missing or invalid JWT token
2. **500 Internal Server Error:** Database connection issues
3. **404 Not Found:** Wrong endpoint URL
4. **CORS Error:** Frontend origin not allowed

### Quick Fixes:

1. **Check server is running:** `http://localhost:4000/health`
2. **Verify database connection:** `http://localhost:4000/api/accounts-test`
3. **Check JWT token:** Make sure it's valid and not expired
4. **Check endpoint URLs:** Ensure they match the server routes

---

## 🎯 Testing Checklist

- [ ] Server health check
- [ ] Database connection test
- [ ] User registration
- [ ] User login (get JWT token)
- [ ] Get all brands
- [ ] Get all categories
- [ ] Get all items
- [ ] Get all stocks
- [ ] Create new item (authenticated)
- [ ] Create new stock entry (authenticated)
- [ ] Create new PC (authenticated)
- [ ] Get dashboard analytics (authenticated)
- [ ] Get category distribution (authenticated)
- [ ] Get low stock items (admin only)
- [ ] Get stock by location (admin only)
- [ ] Get activity logs (authenticated)
- [ ] Create disposal record (authenticated)
- [ ] Check Swagger UI documentation

---

## 📞 Support

If you encounter issues:
1. Check the server console for error messages
2. Verify database connection
3. Check JWT token validity
4. Review the Swagger documentation at `/api-docs`
